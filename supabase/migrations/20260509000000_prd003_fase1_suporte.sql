-- Migration para PRD-003 Fase 1 - Infraestrutura de Suporte por Chat e Tickets
-- Data: 2026-05-09
-- Autor: DevOps Specialist

-- 1. Criar Tipo de Status do Atendimento
DO $$ BEGIN
    CREATE TYPE public.support_status AS ENUM ('aguardando_atendimento', 'em_atendimento', 'finalizado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS public.suporte_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
    status public.support_status NOT NULL DEFAULT 'aguardando_atendimento',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Criar Tabela de Mensagens de Suporte
CREATE TABLE IF NOT EXISTS public.suporte_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.suporte_tickets(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Criar Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_tickets_usuario ON public.suporte_tickets(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.suporte_tickets(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_ticket ON public.suporte_mensagens(ticket_id);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.suporte_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte_mensagens ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para suporte_tickets
DROP POLICY IF EXISTS "Tickets SELECT" ON public.suporte_tickets;
CREATE POLICY "Tickets SELECT" ON public.suporte_tickets
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Tickets INSERT" ON public.suporte_tickets;
CREATE POLICY "Tickets INSERT" ON public.suporte_tickets
    FOR INSERT TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tickets UPDATE" ON public.suporte_tickets;
CREATE POLICY "Tickets UPDATE" ON public.suporte_tickets
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'master')
    WITH CHECK (auth.jwt() ->> 'role' = 'master');

-- 7. Políticas de RLS para suporte_mensagens
DROP POLICY IF EXISTS "Mensagens SELECT" ON public.suporte_mensagens;
CREATE POLICY "Mensagens SELECT" ON public.suporte_mensagens
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Mensagens INSERT" ON public.suporte_mensagens;
CREATE POLICY "Mensagens INSERT" ON public.suporte_mensagens
    FOR INSERT TO public
    WITH CHECK (true);

GRANT ALL ON TABLE public.suporte_tickets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.suporte_mensagens TO anon, authenticated, service_role;
