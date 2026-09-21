-- Migration: 20260921040000_add_gravata_label_personalizado
-- Pedido do usuário: texto do botão da Gravata dos Noivos configurável
-- com as opções existentes, mas também com uma caixa de texto livre de
-- tamanho limitado ('personalizado'). Ver GravataLabel em
-- src/lib/types/database.ts e resolveGravataLabel em
-- src/lib/constants/gravata.ts. Idempotente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS gravata_label_personalizado text;

ALTER TABLE public.configuracoes
  DROP CONSTRAINT IF EXISTS configuracoes_gravata_label_check;

ALTER TABLE public.configuracoes
  ADD CONSTRAINT configuracoes_gravata_label_check
    CHECK (gravata_label IN ('quero_presentear', 'quero_colaborar', 'personalizado'));

-- Limite de 30 caracteres também garantido no banco (defesa em profundidade;
-- a UI já limita via maxLength) — o botão tem espaço limitado.
ALTER TABLE public.configuracoes
  ADD CONSTRAINT configuracoes_gravata_label_personalizado_length_check
    CHECK (gravata_label_personalizado IS NULL OR char_length(gravata_label_personalizado) <= 30);

COMMENT ON COLUMN public.configuracoes.gravata_label_personalizado IS
  'Texto livre do botão da Gravata quando gravata_label = ''personalizado'' (máx. 30 caracteres). Ver resolveGravataLabel em src/lib/constants/gravata.ts.';
