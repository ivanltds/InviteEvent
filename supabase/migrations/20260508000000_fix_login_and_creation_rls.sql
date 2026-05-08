-- Migration: Fix Login, Profile Update and Event Creation RLS
-- Objetivo: Resolver falhas de login e criação de eventos para novos usuários.

-- 1. Permitir que usuários atualizem seu próprio perfil (Necessário no Login/Onboarding)
CREATE POLICY "Usuários atualizam seu próprio perfil" ON public.perfis
    FOR UPDATE USING (auth.uid() = id);

-- 2. Ajustar Políticas de Eventos para permitir CRIAÇÃO (SaaS flow)
-- Antigamente o FOR ALL exigia que o usuário já fosse Owner, o que impedia a criação do primeiro evento.
DROP POLICY IF EXISTS "Eventos: Gestão Master/Owner" ON eventos;

CREATE POLICY "Eventos: Inserção por usuários autenticados" ON eventos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Eventos: Gestão Master/Owner" ON eventos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = eventos.id AND user_id = auth.uid() AND role = 'owner')
    );

-- 3. Ajustar Políticas de Organizadores para permitir vinculação inicial
DROP POLICY IF EXISTS "Orgs: Gestão Master/Owner" ON evento_organizadores;

CREATE POLICY "Orgs: Inserção de si mesmo como Owner" ON evento_organizadores
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (
            -- Permite se for o primeiro organizador do evento (Criação)
            NOT EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = evento_organizadores.evento_id)
            OR
            -- Ou se o executor for Master
            EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        )
    );

CREATE POLICY "Orgs: Gestão Master/Owner" ON evento_organizadores
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR 
        EXISTS (SELECT 1 FROM evento_organizadores orgs WHERE orgs.evento_id = evento_organizadores.evento_id AND orgs.user_id = auth.uid() AND orgs.role = 'owner')
    );

NOTIFY pgrst, 'reload schema';
