-- Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para Atualização Automática de Timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de Convites
CREATE TABLE IF NOT EXISTS convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_principal TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('individual', 'casal', 'familia')),
  limite_pessoas INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de RSVP
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convite_id UUID REFERENCES convites(id) ON DELETE CASCADE,
  confirmados INTEGER NOT NULL,
  restricoes TEXT,
  mensagem TEXT,
  telefone TEXT,
  status TEXT DEFAULT 'confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Presentes
CREATE TABLE IF NOT EXISTS presentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'pausado')),
  quantidade_total INTEGER DEFAULT 1,
  quantidade_reservada INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comprovantes PIX
CREATE TABLE IF NOT EXISTS comprovantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presente_id UUID REFERENCES presentes(id) ON DELETE CASCADE,
  convite_id UUID REFERENCES convites(id) ON DELETE CASCADE, -- Corrigido: CASCADE para limpeza total
  convidado_nome TEXT,
  url_comprovante TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações (Singleton)
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  noiva_nome TEXT DEFAULT 'Layslla',
  noivo_nome TEXT DEFAULT 'Marcus',
  data_casamento DATE DEFAULT '2026-06-13',
  horario_cerimonia TIME DEFAULT '16:00',
  horario_recepcao TIME DEFAULT '18:30',
  local_cerimonia TEXT DEFAULT 'Igreja Matriz',
  endereco_cerimonia TEXT DEFAULT 'Praça da Matriz, Centro',
  mapa_cerimonia TEXT,
  local_recepcao TEXT DEFAULT 'Espaço Jardins',
  endereco_recepcao TEXT DEFAULT 'Estrada das Flores, KM 2',
  mapa_recepcao TEXT,
  mensagem_welcome TEXT DEFAULT 'Bem-vindos ao nosso site!',
  prazo_rsvp DATE DEFAULT '2026-05-13',
  pix_chave TEXT,
  pix_banco TEXT,
  pix_nome TEXT,
  mostrar_historia BOOLEAN DEFAULT true,
  mostrar_noivos BOOLEAN DEFAULT true,
  mostrar_faq BOOLEAN DEFAULT true,
  mostrar_presentes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aplicar Triggers de updated_at
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

-- Função Atômica para Reserva de Presentes (Concorrência)
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

-- Configuração de RLS
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Leitura pública de convites" ON convites FOR SELECT USING (true);
CREATE POLICY "Leitura pública de presentes" ON presentes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de configs" ON configuracoes FOR SELECT USING (true);

CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserção pública de comprovantes" ON comprovantes FOR INSERT WITH CHECK (true);

-- Permissões Admin (Baseado na anon key por enquanto)
CREATE POLICY "Admin full access convites" ON convites FOR ALL USING (true);
CREATE POLICY "Admin full access rsvp" ON rsvp FOR ALL USING (true);
CREATE POLICY "Admin full access presentes" ON presentes FOR ALL USING (true);
CREATE POLICY "Admin full access comprovantes" ON comprovantes FOR ALL USING (true);
CREATE POLICY "Admin update configs" ON configuracoes FOR UPDATE USING (true);

-- Grant
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION reservar_presente_v1 TO anon, authenticated, service_role;

