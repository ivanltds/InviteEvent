-- Migration: Database Review Sprint
-- Objetivo: updated_at, RPC para concorrência, RLS Global e FK Refinement

-- 1. Extensões e Funções Utilitárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar Colunas de Timestamps
ALTER TABLE convites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE presentes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Refinar FKs e Modelagem
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS convite_id UUID REFERENCES convites(id) ON DELETE SET NULL;

-- 4. Aplicar Triggers de updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('convites', 'rsvp', 'presentes', 'comprovantes', 'configuracoes')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE handle_updated_at()', t);
  END LOOP;
END;
$$;

-- 5. Função Atômica para Reserva de Presentes (Resolve Concorrência)
CREATE OR REPLACE FUNCTION reservar_presente_v1(
  p_presente_id UUID,
  p_url_comprovante TEXT,
  p_convite_id UUID DEFAULT NULL,
  p_convidado_nome TEXT DEFAULT 'Convidado via Site'
) RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_reservado INTEGER;
BEGIN
  -- Bloqueia a linha para evitar concorrência (SELECT FOR UPDATE)
  SELECT quantidade_total, quantidade_reservada INTO v_total, v_reservado
  FROM presentes WHERE id = p_presente_id FOR UPDATE;

  IF v_reservado >= v_total THEN
    RETURN json_build_object('success', false, 'message', 'Desculpe, este item acabou de ser esgotado.');
  END IF;

  -- Incrementar reserva
  UPDATE presentes 
  SET 
    quantidade_reservada = v_reservado + 1,
    status = CASE WHEN (v_reservado + 1) >= v_total THEN 'reservado' ELSE 'disponivel' END
  WHERE id = p_presente_id;

  -- Inserir comprovante
  INSERT INTO comprovantes (presente_id, convite_id, convidado_nome, url_comprovante)
  VALUES (p_presente_id, p_convite_id, p_convidado_nome, p_url_comprovante);

  RETURN json_build_object('success', true, 'message', 'Reserva confirmada com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Habilitar RLS em tudo
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- 7. Limpar políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Leitura pública de convites" ON convites;
DROP POLICY IF EXISTS "Leitura pública de presentes" ON presentes;
DROP POLICY IF EXISTS "Leitura pública de configs" ON configuracoes;
DROP POLICY IF EXISTS "Inserção pública de RSVP" ON rsvp;
DROP POLICY IF EXISTS "Inserção pública de comprovantes" ON comprovantes;
DROP POLICY IF EXISTS "Admin full access convites" ON convites;
DROP POLICY IF EXISTS "Admin full access rsvp" ON rsvp;
DROP POLICY IF EXISTS "Admin full access presentes" ON presentes;
DROP POLICY IF EXISTS "Admin full access comprovantes" ON comprovantes;
DROP POLICY IF EXISTS "Admin update configs" ON configuracoes;

-- 8. Definir novas políticas
CREATE POLICY "Leitura pública de convites" ON convites FOR SELECT USING (true);
CREATE POLICY "Leitura pública de presentes" ON presentes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de configs" ON configuracoes FOR SELECT USING (true);

CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserção pública de comprovantes" ON comprovantes FOR INSERT WITH CHECK (true);

-- Admin Policies (Simplified for prototype)
CREATE POLICY "Admin full access convites" ON convites FOR ALL USING (true);
CREATE POLICY "Admin full access rsvp" ON rsvp FOR ALL USING (true);
CREATE POLICY "Admin full access presentes" ON presentes FOR ALL USING (true);
CREATE POLICY "Admin full access comprovantes" ON comprovantes FOR ALL USING (true);
CREATE POLICY "Admin update configs" ON configuracoes FOR UPDATE USING (true);

-- 9. Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION reservar_presente_v1 TO anon, authenticated, service_role;

-- 10. Recarregar Cache
NOTIFY pgrst, 'reload schema';
