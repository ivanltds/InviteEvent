-- Migration: 20260920110000_reconcile_analytics_events
-- Objetivo: nenhuma mudança de comportamento em produção — só captura no
-- repositório a tabela `analytics_events`, que existe em produção mas
-- nunca tinha sido versionada em nenhuma migration (achado INF-05 /
-- FUN-01 da auditoria de 20/09/2026). Sem isso, `supabase start` local
-- falhava ao aplicar 20260513171500_prd012a_smart_gift_foundation.sql
-- (que depende desta tabela), e o banco de desenvolvimento nunca
-- reproduzia produção de verdade.
--
-- Nota de segurança (achada ao reconciliar): RLS está ligado nesta tabela
-- em produção mas SEM NENHUMA policy — na prática isso já nega acesso a
-- anon/authenticated por padrão do Postgres, então não é uma falha ativa.
-- Mas os grants de tabela (INSERT/SELECT/UPDATE/DELETE/TRUNCATE para anon
-- e authenticated) são desnecessariamente amplos: se algum dia uma policy
-- for adicionada por engano, esse teto já permissivo vira o problema.
-- Mantido idêntico à produção aqui (create table + grants), só para não
-- mudar comportamento; considerar apertar os grants numa migration futura.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL,
  session_id text NOT NULL,
  categoria text NOT NULL,
  evento_tipo text NOT NULL,
  target_id text,
  duration_ms integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.analytics_events TO anon, authenticated, service_role;
