-- Migration: Fix RSVP Auth and RLS
-- Objetivo: Garantir que convidados anônimos consigam ler convites e enviar RSVP

-- 1. Tabela de Convites
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de convites" ON convites;
CREATE POLICY "Leitura pública de convites" ON convites FOR SELECT TO anon, authenticated USING (true);

-- 2. Tabela de Configurações
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de configs" ON configuracoes;
CREATE POLICY "Leitura pública de configs" ON configuracoes FOR SELECT TO anon, authenticated USING (true);

-- 3. Tabela RSVP
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inserção pública de RSVP" ON rsvp;
CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Leitura pública de RSVP" ON rsvp;
CREATE POLICY "Leitura pública de RSVP" ON rsvp FOR SELECT TO anon, authenticated USING (true);

-- 4. Tabela de Membros
ALTER TABLE convidados_membros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública membros" ON convidados_membros;
CREATE POLICY "Leitura pública membros" ON convidados_membros FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Atualização pública membros" ON convidados_membros;
CREATE POLICY "Atualização pública membros" ON convidados_membros FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Garantir Grants para anon
GRANT SELECT ON convites TO anon;
GRANT SELECT ON configuracoes TO anon;
GRANT INSERT, SELECT ON rsvp TO anon;
GRANT SELECT, UPDATE ON convidados_membros TO anon;
