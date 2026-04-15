-- Migration: Event Schedule (Story: STORY-028)
-- Objetivo: Suportar múltiplos eventos na agenda do casamento com integração GPS.

CREATE TABLE IF NOT EXISTS eventos_agenda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, -- Ex: Cerimônia, Recepção, Festa
  horario TIME NOT NULL,
  local_nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  link_google_maps TEXT,
  link_waze TEXT,
  icone TEXT DEFAULT 'church', -- icone representativo
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS e Políticas
ALTER TABLE eventos_agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública agenda" ON eventos_agenda;
CREATE POLICY "Leitura pública agenda" ON eventos_agenda FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access agenda" ON eventos_agenda;
CREATE POLICY "Admin full access agenda" ON eventos_agenda FOR ALL USING (true);

-- Grants
GRANT ALL ON TABLE eventos_agenda TO anon, authenticated, service_role;

-- Recarregar Cache
NOTIFY pgrst, 'reload schema';
