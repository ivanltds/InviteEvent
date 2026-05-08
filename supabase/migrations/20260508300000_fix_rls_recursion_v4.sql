-- Migration: Fix RLS Recursion and Admin Access (v4)
-- Objetivo: Eliminar recursão infinita na tabela 'perfis' e garantir carregamento de dados no Dashboard.

-- 1. CRIAR FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- Essas funções ignoram o RLS, evitando loops infinitos.
CREATE OR REPLACE FUNCTION public.check_is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND is_master = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_organizer(p_evento_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Master sempre tem acesso
  IF public.check_is_master() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.evento_organizadores 
    WHERE evento_id = p_evento_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_owner(p_evento_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Master sempre tem acesso
  IF public.check_is_master() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.evento_organizadores 
    WHERE evento_id = p_evento_id AND user_id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. RESET TOTAL DE POLÍTICAS (Agora incluindo TODAS as tabelas principais)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'eventos', 'convites', 'perfis', 'evento_organizadores', 
            'configuracoes', 'presentes', 'faq', 'eventos_agenda',
            'galeria_albuns', 'galeria_fotos', 'mural_mensagens', 'rsvp'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICAS PARA 'PERFIS' (Sem recursão)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfis: Leitura" ON perfis FOR SELECT USING (auth.uid() = id OR check_is_master());
CREATE POLICY "Perfis: Update" ON perfis FOR UPDATE USING (auth.uid() = id OR check_is_master());
CREATE POLICY "Perfis: Inserção" ON perfis FOR INSERT WITH CHECK (true); -- Permitido via trigger/auth

-- 4. POLÍTICAS PARA 'EVENTO_ORGANIZADORES'
ALTER TABLE evento_organizadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs: Leitura" ON evento_organizadores FOR SELECT USING (user_id = auth.uid() OR check_is_master());
CREATE POLICY "Orgs: Gestão" ON evento_organizadores FOR ALL USING (check_is_owner(evento_id));

-- 5. POLÍTICAS PARA 'EVENTOS'
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eventos: Leitura Pública" ON eventos FOR SELECT USING (true);
CREATE POLICY "Eventos: Inserção" ON eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Eventos: Gestão" ON eventos FOR ALL USING (check_is_organizer(id));

-- 6. POLÍTICAS PARA 'CONFIGURACOES'
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config: Leitura Pública" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Config: Gestão" ON configuracoes FOR ALL USING (check_is_owner(evento_id));

-- 7. POLÍTICAS PARA 'CONVITES'
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Convites: Leitura Pública" ON convites FOR SELECT USING (true);
CREATE POLICY "Convites: Gestão" ON convites FOR ALL USING (check_is_organizer(evento_id));

-- 8. POLÍTICAS PARA 'PRESENTES'
ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presentes: Leitura Pública" ON presentes FOR SELECT USING (true);
CREATE POLICY "Presentes: Gestão" ON presentes FOR ALL USING (check_is_organizer(evento_id));

-- 9. POLÍTICAS PARA 'RSVP'
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVP: Leitura Pública" ON rsvp FOR SELECT USING (true);
CREATE POLICY "RSVP: Inserção Pública" ON rsvp FOR INSERT WITH CHECK (true);
CREATE POLICY "RSVP: Gestão" ON rsvp FOR ALL USING (check_is_organizer(evento_id));

-- 10. POLÍTICAS PARA DEMAIS TABELAS (Agenda, Galeria, Mural)
ALTER TABLE eventos_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agenda: Leitura Pública" ON eventos_agenda FOR SELECT USING (true);
CREATE POLICY "Agenda: Gestão" ON eventos_agenda FOR ALL USING (check_is_organizer(evento_id));

ALTER TABLE galeria_albuns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Albuns: Leitura Pública" ON galeria_albuns FOR SELECT USING (true);
CREATE POLICY "Albuns: Gestão" ON galeria_albuns FOR ALL USING (check_is_organizer(evento_id));

ALTER TABLE galeria_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fotos: Leitura Pública" ON galeria_fotos FOR SELECT USING (true);
CREATE POLICY "Fotos: Gestão" ON galeria_fotos FOR ALL USING (check_is_organizer(evento_id));

ALTER TABLE mural_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mural: Leitura Pública" ON mural_mensagens FOR SELECT USING (status = 'aprovado' OR check_is_organizer(evento_id));
CREATE POLICY "Mural: Inserção Pública" ON mural_mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Mural: Gestão" ON mural_mensagens FOR ALL USING (check_is_organizer(evento_id));

-- 11. GRANTS FINAIS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

NOTIFY pgrst, 'reload schema';
