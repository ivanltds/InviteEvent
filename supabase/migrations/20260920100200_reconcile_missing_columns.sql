-- Migration: 20260920100200_reconcile_missing_columns
-- Objetivo: nenhuma mudança de comportamento em produção — só captura no
-- repositório 10 colunas que existem em produção mas nunca tinham sido
-- criadas por nenhuma migration (achado FUN-16 da auditoria de
-- 20/09/2026, confirmado agora contra o schema real via
-- information_schema). A ausência de `eventos.deleted_at` é o que
-- quebrava a listagem "Meus Casamentos" localmente (PostgREST retorna
-- 400: "column eventos.deleted_at does not exist"), derrubando o setup
-- do Playwright e, com ele, 65 testes que nem chegavam a rodar.

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.presentes
  ADD COLUMN IF NOT EXISTS preco_de numeric,
  ADD COLUMN IF NOT EXISTS is_sonho_casal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_label text,
  ADD COLUMN IF NOT EXISTS highlight_icon text;

ALTER TABLE public.presentes_base
  ADD COLUMN IF NOT EXISTS preco_de numeric,
  ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.suporte_tickets
  ADD COLUMN IF NOT EXISTS bot_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS needs_human_attention boolean DEFAULT false;
