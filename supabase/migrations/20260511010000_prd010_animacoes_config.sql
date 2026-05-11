-- Adicionar a coluna animacao_tipo na tabela de configurações
ALTER TABLE public.configuracoes
ADD COLUMN IF NOT EXISTS animacao_tipo text DEFAULT 'padrao';

COMMENT ON COLUMN public.configuracoes.animacao_tipo IS 'Define o tipo de animação de entrada/gateway do convite (padrao, envelope_v3, cinematic, flower_wind)';
