-- Migration: 20260920150000_add_mostrar_mural_secoes_ordem
-- Feature: Mural de Lembranças opcional (removível nas configurações) e
-- ordem das seções do convite reordenável pelos noivos. Idempotente, não
-- remove nem altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS mostrar_mural boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.configuracoes.mostrar_mural IS
  'Se false, remove o botão de Mural de Lembranças do convite e bloqueia acesso direto à rota /mural.';

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS secoes_ordem jsonb NOT NULL DEFAULT '["historia","noivos","agenda","rsvp","faq"]'::jsonb;

COMMENT ON COLUMN public.configuracoes.secoes_ordem IS
  'Ordem de exibição das seções do convite (historia, noivos, agenda, rsvp, faq), reordenável nas configurações. Ver SECOES_CONVITE_ORDEM_PADRAO no código.';
