-- Migration: Photo Gallery and Albums (Updated with Dimensions)
-- Objetivo: Suportar compartilhamento de fotos organizado por álbuns com suporte a dimensões.

-- 1. Tabela de Álbuns
CREATE TABLE IF NOT EXISTS galeria_albuns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    capa_url TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Fotos
CREATE TABLE IF NOT EXISTS galeria_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES galeria_albuns(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    public_id TEXT NOT NULL, -- Referência Cloudinary
    legenda TEXT,
    largura INTEGER,
    altura INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE galeria_albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_fotos ENABLE ROW LEVEL SECURITY;

-- Se as políticas já existirem, o comando abaixo falhará em alguns ambientes, então usamos blocos DO ou DROP antes.
DROP POLICY IF EXISTS "Galeria: Leitura Pública" ON galeria_albuns;
DROP POLICY IF EXISTS "Galeria Fotos: Leitura Pública" ON galeria_fotos;
DROP POLICY IF EXISTS "Galeria: Gestão Organizador" ON galeria_albuns;
DROP POLICY IF EXISTS "Galeria Fotos: Gestão Organizador" ON galeria_fotos;

CREATE POLICY "Galeria: Leitura Pública" ON galeria_albuns FOR SELECT USING (true);
CREATE POLICY "Galeria Fotos: Leitura Pública" ON galeria_fotos FOR SELECT USING (true);

CREATE POLICY "Galeria: Gestão Organizador" ON galeria_albuns
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = galeria_albuns.evento_id AND user_id = auth.uid())
    );

CREATE POLICY "Galeria Fotos: Gestão Organizador" ON galeria_fotos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = galeria_fotos.evento_id AND user_id = auth.uid())
    );

NOTIFY pgrst, 'reload schema';
