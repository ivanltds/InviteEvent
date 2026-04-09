-- Migration: Add user ownership to configurations
-- Objetivo: Vincular eventos a usuários reais do Supabase Auth

-- 1. Adicionar coluna user_id na tabela configuracoes
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Adicionar coluna user_id nas tabelas relacionadas para futuro multi-tenancy robusto
ALTER TABLE convites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE presentes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Índice para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_user_id ON configuracoes(user_id);

-- Recarregar cache
NOTIFY pgrst, 'reload schema';
