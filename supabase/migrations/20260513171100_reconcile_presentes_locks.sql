-- Migration: 20260513171100_reconcile_presentes_locks
-- Objetivo: nenhuma mudança de comportamento em produção — só captura no
-- repositório a tabela presentes_locks (trava atômica de reserva de
-- cotas/presentes), que existe em produção mas nunca tinha sido criada
-- por nenhuma migration (achado INF-05 / FUN-01 da auditoria de
-- 20/09/2026). Posicionada antes de
-- 20260513171500_prd012a_smart_gift_foundation.sql, a primeira migration
-- que depende dela existir. Definição copiada verbatim do catálogo real
-- de produção em 20/09/2026.

CREATE TABLE IF NOT EXISTS public.presentes_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id uuid NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '3 hours'),
  criado_em timestamptz DEFAULT now(),
  convite_id uuid REFERENCES public.convites(id) ON DELETE SET NULL,
  quantidade_cotas integer DEFAULT 1,
  CONSTRAINT unique_presente_session_lock UNIQUE (presente_id, session_id)
);

ALTER TABLE public.presentes_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Locks visíveis publicamente" ON public.presentes_locks;
CREATE POLICY "Locks visíveis publicamente" ON public.presentes_locks
  FOR SELECT TO public USING (true);
-- Sem policy de INSERT/UPDATE/DELETE de propósito: toda escrita passa
-- pelas RPCs SECURITY DEFINER reservar_cotas_presente_v2 /
-- liberar_lock_presente_v1 (ver 20260920100100_reconcile_undocumented_rpcs.sql).
