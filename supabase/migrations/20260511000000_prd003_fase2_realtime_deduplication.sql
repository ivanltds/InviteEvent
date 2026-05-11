-- ==========================================
-- PRD-003 FASE 2: SUPORTE V2 & KANBAN REALTIME
-- Data: 2026-05-11
-- ==========================================

-- 1. UNLOCKING ACCESS (RLS)
CREATE POLICY "Permitir insercao publica de issues" 
ON public.issues FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Permitir leitura publica de issues" 
ON public.issues FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Permitir atualizacao publica de issues" 
ON public.issues FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- 2. SCHEMA NORMALIZATION (INVERSION: 1-ISSUE TO N-TICKETS)
-- Add the pointer to issue from ticket side
ALTER TABLE public.suporte_tickets ADD COLUMN issue_id UUID REFERENCES public.issues(id);

-- Migrate current legacy associations
UPDATE public.suporte_tickets st
SET issue_id = i.id
FROM public.issues i
WHERE i.ticket_id = st.id;

-- Drop the legacy column on the issue table
ALTER TABLE public.issues DROP COLUMN IF EXISTS ticket_id CASCADE;

-- 3. JOIN BRIDGING (FIX ERROR 500 ON NESTED RETRIEVAL)
-- Create explicit foreign key between support_tickets and profiles schema to enable implicit postgrest joining
ALTER TABLE public.suporte_tickets 
ADD CONSTRAINT support_tickets_perfis_fk 
FOREIGN KEY (usuario_id) REFERENCES public.perfis(id);

-- 4. ENABLING REALTIME SYNCHRONIZATION (BYPASS F5)
-- Add the issues table to the replication publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'suporte_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.suporte_tickets;
    END IF;
END $$;
