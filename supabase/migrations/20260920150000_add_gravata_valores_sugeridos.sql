-- Migration: 20260920150000_add_gravata_valores_sugeridos
-- Feature: valores sugeridos de contribuição na Gravata dos Noivos. Os
-- noivos cadastram quantos valores quiserem (sem limite fixo); o
-- convidado escolhe um na tela pública e o QR code/código PIX copia-e-cola
-- são recalculados com esse valor. Idempotente, não altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS gravata_valores_sugeridos numeric[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.configuracoes.gravata_valores_sugeridos IS
  'Valores sugeridos de contribuição na tela da Gravata dos Noivos, cadastrados livremente pelos noivos (sem limite de quantidade).';
