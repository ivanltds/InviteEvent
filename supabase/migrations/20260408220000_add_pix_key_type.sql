-- Migration: Add PIX Key Type
-- Objetivo: Permitir que o usuário identifique explicitamente o tipo de chave

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pix_tipo TEXT DEFAULT 'cpf';
COMMENT ON COLUMN configuracoes.pix_tipo IS 'Tipo da chave PIX: cpf, cnpj, email, telefone, aleatoria';
