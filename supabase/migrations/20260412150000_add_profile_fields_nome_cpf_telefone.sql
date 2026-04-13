-- Adicionar campos Nome, CPF e Telefone à tabela de Perfis
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT;
