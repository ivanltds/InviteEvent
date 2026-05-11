-- ==========================================================
-- AUTOMATED DRIFT RECOVERY: Missing Production Tables
-- Recuperando 'issues' e 'ai_config' detectados em prod via MCP.
-- ==========================================================

-- 1. Criar Tipo de Status da Issue
DO $$ BEGIN
    CREATE TYPE public.issue_status AS ENUM ('aberta', 'visualizada', 'em_correcao', 'corrigida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar Tabela public.issues
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID, -- Temporário para a migração legada do arquivo seguinte
    titulo TEXT NOT NULL,
    descricao TEXT,
    status public.issue_status DEFAULT 'aberta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.issues TO anon, authenticated, service_role;

-- 3. Criar Tabela public.ai_config
CREATE TABLE IF NOT EXISTS public.ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE DEFAULT 'master_prompt',
    system_prompt TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ai_config TO anon, authenticated, service_role;

-- Políticas AI_CONFIG (Acesso Total Master / Leitura Authenticated)
DROP POLICY IF EXISTS "ai_config_select" ON public.ai_config;
CREATE POLICY "ai_config_select" ON public.ai_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ai_config_all" ON public.ai_config;
CREATE POLICY "ai_config_all" ON public.ai_config FOR ALL TO service_role USING (true);
