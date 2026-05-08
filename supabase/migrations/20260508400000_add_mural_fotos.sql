-- Migration: Add Mural Photos and RLS (v5)
-- Objetivo: Criar a tabela de fotos do mural e definir políticas de segurança adequadas.

-- 1. Tabela de Fotos do Mural
CREATE TABLE IF NOT EXISTS mural_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  legenda TEXT,
  guest_name TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS e Políticas
ALTER TABLE mural_fotos ENABLE ROW LEVEL SECURITY;

-- Leitura Pública: Apenas fotos aprovadas ou para organizadores
CREATE POLICY "Mural Fotos: Leitura Pública" ON mural_fotos
    FOR SELECT USING (is_approved = true OR check_is_organizer(evento_id));

-- Inserção Pública: Qualquer um pode mandar foto (vai para moderação)
CREATE POLICY "Mural Fotos: Inserção Pública" ON mural_fotos
    FOR INSERT WITH CHECK (true);

-- Gestão: Organizadores e Master podem tudo
CREATE POLICY "Mural Fotos: Gestão" ON mural_fotos
    FOR ALL USING (check_is_organizer(evento_id));

-- 3. Grants
GRANT SELECT, INSERT ON public.mural_fotos TO anon, authenticated;
GRANT ALL ON public.mural_fotos TO service_role;

NOTIFY pgrst, 'reload schema';
