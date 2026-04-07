-- Migration: Fix Missing Tables and Columns
-- Objetivo: Garantir que a tabela FAQ e as novas colunas de CONFIGURACOES existam.

-- 1. Criar tabela de FAQ se não existir
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas de Bio e História em configuracoes
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS noiva_bio TEXT DEFAULT 'Intensa, forte e decidida.',
ADD COLUMN IF NOT EXISTS noivo_bio TEXT DEFAULT 'Paciente, leve e equilibrado.',
ADD COLUMN IF NOT EXISTS noivos_conclusao TEXT DEFAULT 'Nossas diferenças não nos afastam, mas nos complementam de forma única.',
ADD COLUMN IF NOT EXISTS historia_titulo TEXT DEFAULT 'Nossa História',
ADD COLUMN IF NOT EXISTS historia_subtitulo TEXT DEFAULT 'O Início de Tudo',
ADD COLUMN IF NOT EXISTS historia_texto TEXT DEFAULT 'Tudo começou através de um amigo distante do primo da noiva...',
ADD COLUMN IF NOT EXISTS historia_conclusao TEXT DEFAULT 'O dia 13 de junho não é apenas uma data qualquer.';

-- 3. Adicionar colunas de Estilo Visual em configuracoes
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS bg_primary TEXT DEFAULT '#fdfbf7',
ADD COLUMN IF NOT EXISTS text_main TEXT DEFAULT '#4a4a4a',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8fa89b',
ADD COLUMN IF NOT EXISTS font_cursive TEXT DEFAULT '''Playfair Display'', cursive',
ADD COLUMN IF NOT EXISTS font_serif TEXT DEFAULT '''Lora'', serif';

-- 4. Habilitar RLS no FAQ
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- 5. Políticas FAQ
DROP POLICY IF EXISTS "Leitura pública de faq" ON faq;
CREATE POLICY "Leitura pública de faq" ON faq FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access faq" ON faq;
CREATE POLICY "Admin full access faq" ON faq FOR ALL USING (true);

-- 6. Trigger updated_at para FAQ
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'faq'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON faq FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
  END IF;
END $$;

-- 7. Grants
GRANT ALL ON faq TO anon, authenticated, service_role;

-- 8. Recarregar Cache do PostgREST
NOTIFY pgrst, 'reload schema';
