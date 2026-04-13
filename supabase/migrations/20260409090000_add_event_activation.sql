-- Migration: Add Event Activation and Payment Status
-- Objetivo: Controlar a liberação dos sites dos casamentos mediante pagamento.

-- 1. Adicionar colunas de ativação
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, paid, expired

-- 2. Criar índice para busca rápida de status
CREATE INDEX IF NOT EXISTS idx_eventos_is_active ON eventos(is_active);

-- 3. Atualizar eventos legados para ATIVOS (para não quebrar os noivos originais)
UPDATE eventos SET is_active = true, payment_status = 'paid' WHERE slug = 'evento-principal';

NOTIFY pgrst, 'reload schema';
