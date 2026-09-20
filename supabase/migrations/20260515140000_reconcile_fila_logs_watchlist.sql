-- Migration: 20260515140000_reconcile_fila_logs_watchlist
-- Objetivo: nenhuma mudança de comportamento em produção — só captura no
-- repositório 3 tabelas que existem em produção mas nunca tinham sido
-- criadas por nenhuma migration (achado INF-05 / FUN-01 da auditoria de
-- 20/09/2026): fila_ajuste_links, logs_sistema, watchlist_itens.
-- Posicionada depois de 20260515133000_prd014_cotas_presentes.sql (que
-- cria presentes_base, referenciada aqui por FK) e antes de
-- 20260516000000_stabilization_and_auto_curation.sql (a primeira
-- migration que depende de fila_ajuste_links existir). Definições
-- copiadas verbatim do catálogo real de produção em 20/09/2026.

-- =====================================================================
-- fila_ajuste_links — fila de cura de links quebrados (daemon de IA)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fila_ajuste_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_base_id uuid REFERENCES public.presentes_base(id) ON DELETE SET NULL,
  presente_id uuid REFERENCES public.presentes(id) ON DELETE SET NULL,
  link_quebrado text NOT NULL,
  motivo_quebra text NOT NULL,
  status text NOT NULL DEFAULT 'PENDENTE',
  link_substituto text,
  logs_cura jsonb DEFAULT '[]'::jsonb,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  parceiro_nome text
);

ALTER TABLE public.fila_ajuste_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total Service Role" ON public.fila_ajuste_links;
CREATE POLICY "Acesso total Service Role" ON public.fila_ajuste_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin access fila_ajuste_links" ON public.fila_ajuste_links;
CREATE POLICY "Admin access fila_ajuste_links" ON public.fila_ajuste_links
  FOR ALL TO authenticated USING (check_is_master());

DROP POLICY IF EXISTS "Anon le status para KPIs" ON public.fila_ajuste_links;
CREATE POLICY "Anon le status para KPIs" ON public.fila_ajuste_links
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Convidados e Sistema reportam links quebrados" ON public.fila_ajuste_links;
CREATE POLICY "Convidados e Sistema reportam links quebrados" ON public.fila_ajuste_links
  FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Master total access fila_ajuste_links" ON public.fila_ajuste_links;
CREATE POLICY "Master total access fila_ajuste_links" ON public.fila_ajuste_links
  FOR ALL TO authenticated USING (check_is_master());

-- =====================================================================
-- logs_sistema — log estruturado de operações internas (RPCs, daemon)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id uuid REFERENCES public.eventos(id) ON DELETE CASCADE,
  nivel text DEFAULT 'erro' CHECK (nivel = ANY (ARRAY['info', 'aviso', 'erro', 'critico'])),
  contexto text,
  mensagem text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas Master pode ver logs" ON public.logs_sistema;
CREATE POLICY "Apenas Master pode ver logs" ON public.logs_sistema
  FOR SELECT TO authenticated USING (check_is_master());

DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.logs_sistema;
CREATE POLICY "Sistema pode inserir logs" ON public.logs_sistema
  FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);

-- =====================================================================
-- watchlist_itens — monitoramento de preço/loja campeã do catálogo global
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.watchlist_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_base_id uuid REFERENCES public.presentes_base(id) ON DELETE CASCADE,
  preco_base_original numeric NOT NULL,
  menor_preco_encontrado numeric,
  loja_campea text,
  link_parceiro_atual text,
  frete_estimado numeric DEFAULT 0.00,
  ultima_verificacao timestamptz DEFAULT now(),
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.watchlist_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access watchlist" ON public.watchlist_itens;
CREATE POLICY "Admin access watchlist" ON public.watchlist_itens
  FOR ALL TO authenticated USING (check_is_master());

DROP POLICY IF EXISTS "Master controle total watchlist" ON public.watchlist_itens;
CREATE POLICY "Master controle total watchlist" ON public.watchlist_itens
  FOR ALL TO public USING (EXISTS (SELECT 1 FROM public.perfis WHERE perfis.id = auth.uid() AND perfis.is_master = true));
