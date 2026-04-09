-- Migration: Add Guest Members table
-- Objetivo: Suportar confirmação individual de membros da família/grupo

CREATE TABLE IF NOT EXISTS convidados_membros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convite_id UUID REFERENCES convites(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  confirmado BOOLEAN, -- NULL: pendente, TRUE: vai, FALSE: não vai
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE convidados_membros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública membros" ON convidados_membros;
CREATE POLICY "Leitura pública membros" ON convidados_membros FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access membros" ON convidados_membros;
CREATE POLICY "Admin full access membros" ON convidados_membros FOR ALL USING (true);

-- Grants
GRANT ALL ON TABLE convidados_membros TO anon, authenticated, service_role;

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_membros
BEFORE UPDATE ON convidados_membros
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
