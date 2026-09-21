-- Migration: 20260921020000_add_card_template
-- Modelo visual do cartão de preview (WhatsApp/redes sociais), escolhido
-- pelos noivos em Configurações. Ver CARD_TEMPLATES em
-- src/lib/utils/conviteCard.ts e src/app/api/og/convite/route.tsx.
-- Idempotente, não altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS card_template text NOT NULL DEFAULT 'classico'
    CHECK (card_template IN ('classico', 'circular', 'retrato', 'minimalista', 'romantico', 'colorido'));

COMMENT ON COLUMN public.configuracoes.card_template IS
  'Modelo visual do cartão de preview do convite (og:image) gerado em /api/og/convite. Ver CARD_TEMPLATES em src/lib/utils/conviteCard.ts.';
