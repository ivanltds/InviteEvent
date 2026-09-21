-- Migration: 20260921030000_add_card_template_styles
-- Personalização por modelo do cartão de preview (fonte, tamanho da
-- fonte e zoom da foto), independente para cada um dos 6 modelos. Ver
-- CardTemplateStyles em src/lib/utils/conviteCard.ts e
-- src/app/api/og/convite/route.tsx.
-- Idempotente, não altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS card_template_styles jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.configuracoes.card_template_styles IS
  'Personalização por modelo do cartão de preview (og:image): { [template]: { font, fontScale, image, imageScale } }. Ver CardTemplateStyles em src/lib/utils/conviteCard.ts.';
