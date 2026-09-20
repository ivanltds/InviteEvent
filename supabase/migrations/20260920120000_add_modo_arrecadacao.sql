-- Migration: 20260920120000_add_modo_arrecadacao
-- Feature: Gravata dos Noivos (PRD a definir). Adiciona o modo de
-- arrecadação do evento — Lista de Presentes / Gravata dos Noivos /
-- Nenhum — mantendo compatibilidade com o campo booleano legado
-- `mostrar_presentes`, que continua existindo (nenhuma coluna é
-- removida). Idempotente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS modo_arrecadacao text NOT NULL DEFAULT 'presentes'
    CHECK (modo_arrecadacao IN ('presentes', 'gravata', 'nenhum')),
  ADD COLUMN IF NOT EXISTS gravata_label text NOT NULL DEFAULT 'quero_colaborar'
    CHECK (gravata_label IN ('quero_presentear', 'quero_colaborar')),
  ADD COLUMN IF NOT EXISTS gravata_recado text;

-- Backfill: quem hoje já desligou a lista de presentes (mostrar_presentes
-- = false) deve continuar sem nenhum botão de arrecadação, não ganhar a
-- gravata de surpresa.
UPDATE public.configuracoes
SET modo_arrecadacao = 'nenhum'
WHERE mostrar_presentes = false AND modo_arrecadacao = 'presentes';

COMMENT ON COLUMN public.configuracoes.modo_arrecadacao IS
  'Fonte de verdade para o botão de arrecadação no convite. mostrar_presentes é mantido só como espelho de leitura legada.';
