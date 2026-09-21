-- Migration: 20260921050000_add_card_template_classico_convite
-- Pedido do usuário: variação do modelo Clássico com vinheta no topo e
-- o texto "Você foi convidado para o casamento de" (menor, mesma fonte
-- da data). Novo valor 'classico_convite' em card_template. Ver
-- CARD_TEMPLATES em src/lib/utils/conviteCard.ts e
-- src/app/api/og/convite/route.tsx. Idempotente.

ALTER TABLE public.configuracoes
  DROP CONSTRAINT IF EXISTS configuracoes_card_template_check;

ALTER TABLE public.configuracoes
  ADD CONSTRAINT configuracoes_card_template_check
    CHECK (card_template IN ('classico', 'classico_convite', 'circular', 'retrato', 'minimalista', 'romantico', 'colorido'));
