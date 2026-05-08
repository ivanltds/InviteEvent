-- Migration: Fix 403 Forbidden on Public Access (v2)
-- Objetivo: Restringir políticas de gestão apenas ao papel 'authenticated' para evitar erros de permissão para usuários anônimos.

-- 1. CONFIGURACOES
DROP POLICY IF EXISTS "Config: Gestão Master/Owner" ON configuracoes;
CREATE POLICY "Config: Gestão Master/Owner" ON configuracoes
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = configuracoes.evento_id AND user_id = auth.uid() AND role = 'owner')
    );

-- 2. CONVITES
DROP POLICY IF EXISTS "Convites: Gestão Master/Organizador" ON convites;
CREATE POLICY "Convites: Gestão Master/Organizador" ON convites
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = convites.evento_id AND user_id = auth.uid())
    );

-- 3. PRESENTES
DROP POLICY IF EXISTS "Presentes: Gestão Master/Organizador" ON presentes;
CREATE POLICY "Presentes: Gestão Master/Organizador" ON presentes
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = presentes.evento_id AND user_id = auth.uid())
    );

-- 4. FAQ
DROP POLICY IF EXISTS "FAQ: Gestão Master/Organizador" ON faq;
CREATE POLICY "FAQ: Gestão Master/Organizador" ON faq
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = faq.evento_id AND user_id = auth.uid())
    );

-- 5. EVENTOS
DROP POLICY IF EXISTS "Eventos: Gestão Master/Owner" ON eventos;
CREATE POLICY "Eventos: Gestão Master/Owner" ON eventos
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = eventos.id AND user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "Eventos: Visibilidade Master/Organizador" ON eventos;
CREATE POLICY "Eventos: Visibilidade Master/Organizador" ON eventos
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = eventos.id AND user_id = auth.uid())
    );

-- 6. Garantir permissões de leitura para o papel anon (e authenticated)
GRANT SELECT ON public.eventos TO anon, authenticated;
GRANT SELECT ON public.configuracoes TO anon, authenticated;
GRANT SELECT ON public.convites TO anon, authenticated;
GRANT SELECT ON public.presentes TO anon, authenticated;
GRANT SELECT ON public.faq TO anon, authenticated;
GRANT SELECT ON public.eventos_agenda TO anon, authenticated;
GRANT SELECT ON public.galeria_albuns TO anon, authenticated;
GRANT SELECT ON public.galeria_fotos TO anon, authenticated;
GRANT SELECT ON public.mural_mensagens TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
