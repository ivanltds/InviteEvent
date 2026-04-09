-- Migration: Fix Configuracoes Primary Key for Multi-Tenant
-- Objetivo: Permitir que a tabela configuracoes suporte múltiplos registros (um por evento),
-- removendo a restrição de singleton (id=1) e tornando o ID auto-incremental.

-- 1. Remover a restrição CHECK que forçava id = 1
-- Precisamos descobrir o nome da constraint. Normalmente é 'configuracoes_id_check'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'configuracoes' AND column_name = 'id'
    ) THEN
        ALTER TABLE configuracoes DROP CONSTRAINT IF EXISTS configuracoes_id_check;
    END IF;
END $$;

-- 2. Transformar a coluna ID em auto-incremental (IDENTITY)
-- Primeiro removemos o default 1
ALTER TABLE configuracoes ALTER COLUMN id DROP DEFAULT;

-- Criamos uma sequência para o ID, começando em 2 (assumindo que o id=1 já existe)
CREATE SEQUENCE IF NOT EXISTS configuracoes_id_seq START WITH 2;
ALTER TABLE configuracoes ALTER COLUMN id SET DEFAULT nextval('configuracoes_id_seq');

-- Garantir que o valor atual da sequência seja o maior ID + 1
SELECT setval('configuracoes_id_seq', COALESCE((SELECT MAX(id) FROM configuracoes), 1));

-- 3. Garantir que evento_id seja obrigatório e único (exceto para registros legados órfãos, se houver)
-- Se já existir a UNIQUE de evento_id, mantemos. Se houver nulos, precisamos tratar.
UPDATE configuracoes SET evento_id = (SELECT id FROM eventos LIMIT 1) WHERE evento_id IS NULL AND (SELECT count(*) FROM eventos) > 0;

-- 4. Notificar recarregamento do esquema
NOTIFY pgrst, 'reload schema';
