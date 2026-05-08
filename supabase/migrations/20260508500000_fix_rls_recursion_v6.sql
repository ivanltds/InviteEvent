-- Migration: Fix RLS Recursion and Mural Tables (v6)
-- Objetivo: Eliminar recursão infinita e corrigir nomes de tabelas no Mural.

-- 1. RE-CRIAR FUNÇÕES AUXILIARES (Mais robustas contra recursão)
CREATE OR REPLACE FUNCTION public.check_is_master()
RETURNS BOOLEAN AS $$
DECLARE
  _is_master BOOLEAN;
BEGIN
  -- SECURITY DEFINER + query direta na tabela pública ignora RLS do chamador
  SELECT is_master INTO _is_master FROM public.perfis WHERE id = auth.uid();
  RETURN COALESCE(_is_master, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_organizer(p_evento_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se for master, tem acesso total
  IF public.check_is_master() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.evento_organizadores 
    WHERE evento_id = p_evento_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESET DE POLÍTICAS PARA AS TABELAS AFETADAS
DROP POLICY IF EXISTS "Perfis: Leitura" ON perfis;
DROP POLICY IF EXISTS "Perfis: Leitura Própria" ON perfis;
DROP POLICY IF EXISTS "Perfis: Master vê tudo" ON perfis;

-- 3. NOVA POLÍTICA PARA 'PERFIS' (MUITO SIMPLES PARA EVITAR LOOP)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
-- Apenas o próprio usuário ou o Master (via função que pula RLS) podem ler
CREATE POLICY "Perfis: Leitura Final" ON perfis 
    FOR SELECT USING (auth.uid() = id OR (SELECT public.check_is_master()));

-- 4. GARANTIR QUE MURAL_FOTOS EXISTE E TEM RLS CORRETO
CREATE TABLE IF NOT EXISTS mural_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  legenda TEXT,
  guest_name TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mural_fotos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mural Fotos: Leitura Pública" ON mural_fotos;
DROP POLICY IF EXISTS "Mural Fotos: Inserção Pública" ON mural_fotos;
DROP POLICY IF EXISTS "Mural Fotos: Gestão" ON mural_fotos;

CREATE POLICY "Mural Fotos: Leitura Pública" ON mural_fotos FOR SELECT USING (is_approved = true OR public.check_is_organizer(evento_id));
CREATE POLICY "Mural Fotos: Inserção Pública" ON mural_fotos FOR INSERT WITH CHECK (true);
CREATE POLICY "Mural Fotos: Gestão" ON mural_fotos FOR ALL USING (public.check_is_organizer(evento_id));

-- 5. AJUSTAR MURAL_MENSAGENS (Onde deu erro de "not a function" / "table not found")
ALTER TABLE mural_mensagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mural Mensagens: Leitura Pública" ON mural_mensagens;
DROP POLICY IF EXISTS "Mural Mensagens: Inserção Pública" ON mural_mensagens;
DROP POLICY IF EXISTS "Mural Mensagens: Gestão" ON mural_mensagens;

CREATE POLICY "Mural Mensagens: Leitura Pública" ON mural_mensagens FOR SELECT USING (status = 'aprovado' OR public.check_is_organizer(evento_id));
CREATE POLICY "Mural Mensagens: Inserção Pública" ON mural_mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY "Mural Mensagens: Gestão" ON mural_mensagens FOR ALL USING (public.check_is_organizer(evento_id));

-- 6. GRANTS
GRANT SELECT, INSERT ON public.mural_fotos TO anon, authenticated;
GRANT SELECT, INSERT ON public.mural_mensagens TO anon, authenticated;
GRANT ALL ON public.mural_fotos TO service_role;
GRANT ALL ON public.mural_mensagens TO service_role;

NOTIFY pgrst, 'reload schema';
