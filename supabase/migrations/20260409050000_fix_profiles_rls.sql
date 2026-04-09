-- Migration: Fix profiles RLS and missing select policy
-- Objetivo: Garantir que o EventProvider consiga ler o perfil do usuário logado.

CREATE POLICY "Usuários vêem seu próprio perfil" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

-- Garantir que o Master consiga ver todos os perfis (para gestão de equipe)
CREATE POLICY "Master vê todos os perfis" ON public.perfis
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
    );

NOTIFY pgrst, 'reload schema';
