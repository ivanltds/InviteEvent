-- Migration: 20260920100100_reconcile_undocumented_rpcs
-- Objetivo: nenhuma mudança de comportamento — só captura no repositório
-- 3 funções que existiam em produção mas nunca tinham sido versionadas em
-- nenhuma migration (achado INF-05 / TST-03 da auditoria de 20/09/2026).
-- As definições abaixo foram copiadas verbatim do catálogo real de
-- produção (pg_get_functiondef) em 20/09/2026. CREATE OR REPLACE é
-- idempotente: aplicar isto em produção não altera nada que já existe lá,
-- só passa a existir também no histórico de migrations.

CREATE OR REPLACE FUNCTION public.check_is_owner(p_evento_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.evento_organizadores
    WHERE evento_id = p_evento_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$function$;

-- Reserva atômica de cotas/lock de presente. Trava a linha do presente com
-- FOR UPDATE antes de calcular disponibilidade — é de fato atômica (a
-- auditoria de testes, TST-03, não encontrou teste que provasse isso
-- porque a função nem estava no repositório para ser lida).
CREATE OR REPLACE FUNCTION public.reservar_cotas_presente_v2(p_presente_id uuid, p_convite_id uuid, p_session_id text, p_quantidade_solicitada integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_disponivel INTEGER;
    v_total_cotas INTEGER;
    v_cotas_compradas INTEGER;
    v_locks_ativos INTEGER;
BEGIN
    -- 1. Lock da linha do presente
    SELECT total_cotas, cotas_compradas
    INTO v_total_cotas, v_cotas_compradas
    FROM public.presentes
    WHERE id = p_presente_id AND permite_cotas = true
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Tenta presente individual
        SELECT 1, quantidade_reservada
        INTO v_total_cotas, v_cotas_compradas
        FROM public.presentes
        WHERE id = p_presente_id AND status = 'disponivel'
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN false;
        END IF;
    END IF;

    -- 2. Cálculo de disponibilidade considerando locks de outros (exclui o meu próprio se já existir para update)
    SELECT COALESCE(SUM(quantidade_cotas), 0)
    INTO v_locks_ativos
    FROM public.presentes_locks
    WHERE presente_id = p_presente_id
      AND expira_em > NOW()
      AND session_id != p_session_id;

    v_disponivel := v_total_cotas - (v_cotas_compradas + v_locks_ativos);

    -- 3. Verificação de Saldo
    IF v_disponivel < p_quantidade_solicitada THEN
        -- Log de Falha
        INSERT INTO public.logs_sistema (contexto, nivel, mensagem, metadata)
        VALUES ('rpc-reserva', 'aviso', 'Tentativa de reserva sem estoque',
                jsonb_build_object('presente_id', p_presente_id, 'solicitado', p_quantidade_solicitada, 'disponivel', v_disponivel));
        RETURN false;
    END IF;

    -- 4. Upsert do Lock (Garante que se eu clicar 2x eu renovo o meu lock)
    INSERT INTO public.presentes_locks (presente_id, convite_id, session_id, quantidade_cotas, expira_em)
    VALUES (p_presente_id, p_convite_id, p_session_id, p_quantidade_solicitada, NOW() + INTERVAL '3 hours')
    ON CONFLICT (presente_id, session_id)
    DO UPDATE SET
        quantidade_cotas = EXCLUDED.quantidade_cotas,
        expira_em = EXCLUDED.expira_em,
        convite_id = EXCLUDED.convite_id;

    -- Log de Sucesso (Novo para auditoria de estresse)
    INSERT INTO public.logs_sistema (contexto, nivel, mensagem, metadata)
    VALUES ('rpc-reserva', 'info', 'Reserva efetuada com sucesso',
            jsonb_build_object('presente_id', p_presente_id, 'session_id', p_session_id));

    RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.liberar_lock_presente_v1(p_presente_id uuid, p_session_id text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    DELETE FROM public.presentes_locks
    WHERE presente_id = p_presente_id AND session_id = p_session_id;
$function$;
