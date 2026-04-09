-- Migration: Multi-Tenant Architecture and RBAC
-- Objetivo: Suportar múltiplos eventos, múltiplos admins e usuário Master.

-- 1. Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Perfis (Extensão de auth.users)
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_master BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Organizadores (RBAC)
CREATE TYPE organizer_role AS ENUM ('owner', 'organizador');

CREATE TABLE IF NOT EXISTS evento_organizadores (
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role organizer_role NOT NULL DEFAULT 'organizador',
    PRIMARY KEY (evento_id, user_id)
);

-- 4. Adicionar evento_id nas tabelas existentes
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;
ALTER TABLE convites ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;
ALTER TABLE presentes ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- 5. Função para marcar o primeiro usuário como Master
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, email, is_master)
    VALUES (
        NEW.id, 
        NEW.email, 
        NOT EXISTS (SELECT 1 FROM public.perfis) -- Se for o primeiro, is_master = true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- 6. Migração de dados existentes (L & M)
-- Criar evento padrão para o registro atual id=1
DO $$
DECLARE
    v_evento_id UUID;
    v_owner_id UUID;
BEGIN
    -- Verificar se já existe um owner (baseado no user_id da configuracoes)
    SELECT user_id INTO v_owner_id FROM configuracoes WHERE id = 1;
    
    -- Criar o primeiro evento se houver dados
    IF EXISTS (SELECT 1 FROM configuracoes WHERE id = 1) THEN
        INSERT INTO eventos (nome, slug) 
        VALUES ('Evento Principal', 'evento-principal')
        RETURNING id INTO v_evento_id;

        -- Vincular dados existentes ao novo evento
        UPDATE configuracoes SET evento_id = v_evento_id WHERE id = 1;
        UPDATE convites SET evento_id = v_evento_id;
        UPDATE presentes SET evento_id = v_evento_id;

        -- Se houver um owner, adicioná-lo
        IF v_owner_id IS NOT NULL THEN
            INSERT INTO evento_organizadores (evento_id, user_id, role)
            VALUES (v_evento_id, v_owner_id, 'owner');
        END IF;
    END IF;
END $$;

-- 7. Políticas RLS (Exemplo base)
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_organizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Política: Master vê tudo, Organizadores vêem seus eventos
CREATE POLICY "Organizadores podem ver seus eventos" ON eventos
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = eventos.id AND user_id = auth.uid())
    );

CREATE POLICY "Owners podem atualizar seus eventos" ON eventos
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = eventos.id AND user_id = auth.uid() AND role = 'owner')
    );

-- Habilitar RLS em tudo
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;

-- Simplificar políticas existentes para usar evento_id + evento_organizadores
-- Nota: Isso requer limpar as políticas antigas, faremos isso em migração separada se necessário.

NOTIFY pgrst, 'reload schema';
