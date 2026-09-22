-- Migration: 20260923010000_team_invitations_and_multi_owner
-- Objetivo: Suportar múltiplos proprietários por evento e links mágicos de convite compartilháveis (WhatsApp/Link direto).

-- 1. Tabela de Convites de Equipe
CREATE TABLE IF NOT EXISTS public.evento_convites_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    email TEXT,
    role organizer_role NOT NULL DEFAULT 'owner',
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usado_em TIMESTAMPTZ,
    usado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_evento_convites_token ON public.evento_convites_equipe(token);
CREATE INDEX IF NOT EXISTS idx_evento_convites_evento ON public.evento_convites_equipe(evento_id);

-- Habilitar RLS
ALTER TABLE public.evento_convites_equipe ENABLE ROW LEVEL SECURITY;

-- Proprietários podem gerenciar os convites do seu evento
DROP POLICY IF EXISTS "Convites Equipe: Gestão por Proprietários" ON public.evento_convites_equipe;
CREATE POLICY "Convites Equipe: Gestão por Proprietários" ON public.evento_convites_equipe
  FOR ALL TO authenticated
  USING (public.check_is_owner(evento_id))
  WITH CHECK (public.check_is_owner(evento_id));

-- Leitura pública para validação inicial de token não expirado
DROP POLICY IF EXISTS "Convites Equipe: Leitura Pública por Token" ON public.evento_convites_equipe;
CREATE POLICY "Convites Equipe: Leitura Pública por Token" ON public.evento_convites_equipe
  FOR SELECT TO public
  USING (usado_em IS NULL AND expira_em > now());

-- 2. Função para Obter Informações do Convite (segura, para exibir na tela de aceite)
CREATE OR REPLACE FUNCTION public.obter_info_convite_equipe(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_convite public.evento_convites_equipe%ROWTYPE;
    v_evento_nome text;
    v_criador_email text;
BEGIN
    SELECT * INTO v_convite
    FROM public.evento_convites_equipe
    WHERE token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Convite não encontrado ou link incorreto.');
    END IF;

    IF v_convite.usado_em IS NOT NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Este convite já foi utilizado.');
    END IF;

    IF v_convite.expira_em < now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Este convite expirou.');
    END IF;

    SELECT nome INTO v_evento_nome FROM public.eventos WHERE id = v_convite.evento_id;
    SELECT email INTO v_criador_email FROM public.perfis WHERE id = v_convite.criado_por;

    RETURN jsonb_build_object(
        'valid', true,
        'evento_id', v_convite.evento_id,
        'evento_nome', COALESCE(v_evento_nome, 'Evento'),
        'role', v_convite.role,
        'email_destinatario', v_convite.email,
        'criado_por_email', v_criador_email,
        'expira_em', v_convite.expira_em
    );
END;
$$;

-- 3. Função para Aceitar Convite de Equipe (atômica e com SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.aceitar_convite_equipe(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_convite public.evento_convites_equipe%ROWTYPE;
    v_user_id uuid := auth.uid();
    v_user_email text;
    v_evento_nome text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado. Faça login para aceitar o convite.';
    END IF;

    -- Travar linha para evitar race conditions
    SELECT * INTO v_convite
    FROM public.evento_convites_equipe
    WHERE token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite inválido ou link incorreto.';
    END IF;

    IF v_convite.usado_em IS NOT NULL THEN
        RAISE EXCEPTION 'Este convite já foi utilizado.';
    END IF;

    IF v_convite.expira_em < now() THEN
        RAISE EXCEPTION 'Este convite já expirou.';
    END IF;

    -- Se tiver e-mail especificado, valida se o usuário autenticado é o dono do e-mail
    IF v_convite.email IS NOT NULL THEN
        SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
        IF LOWER(TRIM(v_convite.email)) <> LOWER(TRIM(v_user_email)) THEN
            RAISE EXCEPTION 'Este convite foi gerado exclusivamente para o e-mail %.', v_convite.email;
        END IF;
    END IF;

    -- Garante que o perfil do usuário exista na tabela perfis
    INSERT INTO public.perfis (id, email)
    SELECT u.id, u.email
    FROM auth.users u
    WHERE u.id = v_user_id
    ON CONFLICT (id) DO NOTHING;

    -- Vincula o usuário ao evento com o papel correspondente (suporta múltiplos owners)
    INSERT INTO public.evento_organizadores (evento_id, user_id, role)
    VALUES (v_convite.evento_id, v_user_id, v_convite.role)
    ON CONFLICT (evento_id, user_id) 
    DO UPDATE SET role = EXCLUDED.role;

    -- Marca o convite como utilizado
    UPDATE public.evento_convites_equipe
    SET usado_em = now(),
        usado_por = v_user_id
    WHERE id = v_convite.id;

    SELECT nome INTO v_evento_nome FROM public.eventos WHERE id = v_convite.evento_id;

    RETURN jsonb_build_object(
        'success', true,
        'evento_id', v_convite.evento_id,
        'evento_nome', COALESCE(v_evento_nome, 'Evento'),
        'role', v_convite.role
    );
END;
$$;
