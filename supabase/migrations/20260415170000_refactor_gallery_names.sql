-- Migration: Refactor Gallery Table Names (Story: EPIC-009)
-- Objetivo: Alinhar nomes de tabelas com o código existente no galleryService.ts

-- 1. Renomear ou Criar tabelas com nomes longos
DROP TABLE IF EXISTS fotos;
DROP TABLE IF EXISTS albuns;

CREATE TABLE IF NOT EXISTS galeria_albuns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galeria_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES galeria_albuns(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT,
  largura INTEGER,
  altura INTEGER,
  legenda TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS e Políticas
ALTER TABLE galeria_albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas Álbuns
DROP POLICY IF EXISTS "Leitura pública albuns" ON galeria_albuns;
CREATE POLICY "Leitura pública albuns" ON galeria_albuns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access albuns" ON galeria_albuns;
CREATE POLICY "Admin full access albuns" ON galeria_albuns FOR ALL USING (true);

-- Políticas Fotos
DROP POLICY IF EXISTS "Leitura pública fotos" ON galeria_fotos;
CREATE POLICY "Leitura pública fotos" ON galeria_fotos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access fotos" ON galeria_fotos;
CREATE POLICY "Admin full access fotos" ON galeria_fotos FOR ALL USING (true);

-- 3. Grants
GRANT ALL ON galeria_albuns TO anon, authenticated, service_role;
GRANT ALL ON galeria_fotos TO anon, authenticated, service_role;

-- Recarregar Cache
NOTIFY pgrst, 'reload schema';
