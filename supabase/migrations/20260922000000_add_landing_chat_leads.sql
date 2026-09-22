-- STORY-062: Chat de vendas/orientação na Landing Page, com captura de lead.
--
-- Diferente de `suporte_tickets`/`suporte_mensagens` (RLS `USING (true)`
-- totalmente aberta pra anon/authenticated — ver
-- 20260509000000_prd003_fase1_suporte.sql), aqui a RLS é restritiva desde
-- o início: visitante anônimo só pode INSERIR (criar lead, mandar
-- mensagem). Nenhuma policy de SELECT/UPDATE/DELETE pra anon/authenticated
-- — toda leitura (retomar sessão, montar histórico da conversa) passa pela
-- API route (src/app/api/landing-chat/route.ts) usando a service role no
-- servidor, filtrando por session_id. SELECT só é liberado pra master
-- (public.check_is_master(), mesma função usada em requireMaster.ts), para
-- um painel de leads futuro.

CREATE TABLE IF NOT EXISTS public.landing_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    email TEXT,
    whatsapp TEXT,
    origem TEXT DEFAULT 'landing_chat',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    convertido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.landing_chat_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.landing_leads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_landing_chat_mensagens_lead ON public.landing_chat_mensagens(lead_id);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_chat_mensagens ENABLE ROW LEVEL SECURITY;

-- INSERT liberado pra anon/authenticated: é só a criação do lead/mensagem
-- de um visitante, sem leitura de dado alheio envolvida.
DROP POLICY IF EXISTS "Visitante cria seu proprio lead" ON public.landing_leads;
CREATE POLICY "Visitante cria seu proprio lead" ON public.landing_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Visitante envia mensagem" ON public.landing_chat_mensagens;
CREATE POLICY "Visitante envia mensagem" ON public.landing_chat_mensagens
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- SELECT/UPDATE/DELETE: só master. A API route usa a service role (que
-- ignora RLS) pra ler/atualizar em nome do visitante durante a conversa.
DROP POLICY IF EXISTS "Master le leads" ON public.landing_leads;
CREATE POLICY "Master le leads" ON public.landing_leads
  FOR SELECT TO authenticated USING (public.check_is_master());

DROP POLICY IF EXISTS "Master atualiza leads" ON public.landing_leads;
CREATE POLICY "Master atualiza leads" ON public.landing_leads
  FOR UPDATE TO authenticated USING (public.check_is_master());

DROP POLICY IF EXISTS "Master exclui leads" ON public.landing_leads;
CREATE POLICY "Master exclui leads" ON public.landing_leads
  FOR DELETE TO authenticated USING (public.check_is_master());

DROP POLICY IF EXISTS "Master le mensagens" ON public.landing_chat_mensagens;
CREATE POLICY "Master le mensagens" ON public.landing_chat_mensagens
  FOR SELECT TO authenticated USING (public.check_is_master());

-- Grants explícitos: SELECT + INSERT pra anon/authenticated (nunca ALL,
-- pra não repetir o padrão aberto demais das tabelas de suporte antigas).
-- SELECT aqui é redundante com a ausência de policy de SELECT pra esses
-- roles (RLS ainda bloqueia a leitura), mas mantemos só INSERT no grant
-- pra deixar a intenção explícita: anon/authenticated não devem conseguir
-- ler linha nenhuma dessas tabelas via client direto.
GRANT INSERT ON public.landing_leads TO anon, authenticated;
GRANT INSERT ON public.landing_chat_mensagens TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.landing_leads TO authenticated;
GRANT SELECT ON public.landing_chat_mensagens TO authenticated;
GRANT ALL ON public.landing_leads TO service_role;
GRANT ALL ON public.landing_chat_mensagens TO service_role;
