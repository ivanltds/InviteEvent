-- Migration: Add external link to gifts
-- Objetivo: Permitir que o casal adicione links de lojas externas para presentes
-- Story: STORY-060

ALTER TABLE presentes ADD COLUMN IF NOT EXISTS link_externo TEXT;

-- Forçar atualização do cache do esquema (PostgREST)
-- Nota: Isso é um gatilho para o Supabase reconhecer novas colunas imediatamente
NOTIFY pgrst, 'reload schema';
