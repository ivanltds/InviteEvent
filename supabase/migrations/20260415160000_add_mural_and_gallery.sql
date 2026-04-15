-- Migration: Gallery V2 and Mural (Story: EPIC-009)
-- Objetivo: Suportar Álbuns, Fotos e o Mural de Recados.

-- 1. Tabela de Álbuns
CREATE TABLE IF NOT EXISTS albuns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Fotos
CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albuns(id) ON DELETE CASCADE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT, -- ID do Cloudinary
  largura INTEGER,
  altura INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Mural de Recados
CREATE TABLE IF NOT EXISTS mural_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  nome_convidado TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, oculto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS e Políticas
ALTER TABLE albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mural_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas Álbuns
DROP POLICY IF EXISTS "Leitura pública albuns" ON albuns;
CREATE POLICY "Leitura pública albuns" ON albuns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access albuns" ON albuns;
CREATE POLICY "Admin full access albuns" ON albuns FOR ALL USING (true);

-- Políticas Fotos
DROP POLICY IF EXISTS "Leitura pública fotos" ON fotos;
CREATE POLICY "Leitura pública fotos" ON fotos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access fotos" ON fotos;
CREATE POLICY "Admin full access fotos" ON fotos FOR ALL USING (true);

-- Políticas Mural
DROP POLICY IF EXISTS "Leitura pública mural" ON mural_mensagens;
CREATE POLICY "Leitura pública mural" ON mural_mensagens FOR SELECT USING (status = 'aprovado');
DROP POLICY IF EXISTS "Inserção pública mural" ON mural_mensagens;
CREATE POLICY "Inserção pública mural" ON mural_mensagens FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access mural" ON mural_mensagens;
CREATE POLICY "Admin full access mural" ON mural_mensagens FOR ALL USING (true);

-- Grants
GRANT ALL ON albuns TO anon, authenticated, service_role;
GRANT ALL ON fotos TO anon, authenticated, service_role;
GRANT ALL ON mural_mensagens TO anon, authenticated, service_role;

-- Recarregar Cache
NOTIFY pgrst, 'reload schema';
