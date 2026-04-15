-- Migração: Refinar Gestão de Membros de Convite (Story: STORY-053)
-- Objetivo: Garantir colunas de restrições e multi-tenancy na tabela de membros.

-- 1. Renomear tabela se o nome antigo (do Antigravity) ainda existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'convidados_membros') THEN
    ALTER TABLE convidados_membros RENAME TO convite_membros;
  END IF;
END
$$;

-- 2. Garantir que a tabela convite_membros exista
CREATE TABLE IF NOT EXISTS convite_membros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convite_id UUID REFERENCES convites(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  confirmado BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REPARO: Adicionar colunas caso a tabela já existisse sem elas (Crucial para o erro PGRST204)
ALTER TABLE convite_membros ADD COLUMN IF NOT EXISTS restricoes TEXT;
ALTER TABLE convite_membros ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- 4. RLS e Políticas
ALTER TABLE convite_membros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública membros" ON convite_membros;
CREATE POLICY "Leitura pública membros" ON convite_membros FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserção pública membros" ON convite_membros;
CREATE POLICY "Inserção pública membros" ON convite_membros FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update público membros" ON convite_membros;
CREATE POLICY "Update público membros" ON convite_membros FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin full access membros" ON convite_membros;
CREATE POLICY "Admin full access membros" ON convite_membros FOR ALL USING (true);

-- 5. Grants
GRANT ALL ON TABLE convite_membros TO anon, authenticated, service_role;

-- 6. Recarregar Cache do Supabase
NOTIFY pgrst, 'reload schema';
