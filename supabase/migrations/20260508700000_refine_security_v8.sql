-- Migration: Refine Security Functions and RLS (v8)
-- Objetivo: Garantir que as funções de segurança sejam robustas e as políticas de RLS estejam aplicadas corretamente em todas as tabelas.

-- 1. Funções com SEARCH_PATH definido (Boa prática de segurança)
CREATE OR REPLACE FUNCTION public.check_is_master()
RETURNS BOOLEAN AS $$
DECLARE
  _is_master BOOLEAN;
BEGIN
  SELECT is_master INTO _is_master FROM public.perfis WHERE id = auth.uid();
  RETURN COALESCE(_is_master, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_organizer(p_evento_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.check_is_master() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.evento_organizadores 
    WHERE evento_id = p_evento_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Garantir que as políticas de Convites e Membros usem a função correta
DROP POLICY IF EXISTS "Convites: Gestão" ON public.convites;
CREATE POLICY "Convites: Gestão" ON public.convites 
    FOR ALL TO authenticated USING (public.check_is_organizer(evento_id));

DROP POLICY IF EXISTS "Membros: Gestão" ON public.convite_membros;
CREATE POLICY "Membros: Gestão" ON public.convite_membros 
    FOR ALL TO authenticated USING (public.check_is_organizer(evento_id));

-- 3. RSVP (Garantir que admin possa gerenciar RSVP)
DROP POLICY IF EXISTS "RSVP: Gestão" ON public.rsvp;
CREATE POLICY "RSVP: Gestão" ON public.rsvp 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.convites 
            WHERE id = rsvp.convite_id AND public.check_is_organizer(evento_id)
        )
    );

-- 4. Re-confirmar Grants de DML (Garantia STORY-042)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
