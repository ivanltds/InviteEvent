-- Migração gerada automaticamente a partir do SSOT (supabase-schema.sql)

-- Tabela de Convites
CREATE TABLE IF NOT EXISTS convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_principal TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('individual', 'casal', 'familia')),
  limite_pessoas INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de RSVP
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convite_id UUID REFERENCES convites(id),
  confirmados INTEGER NOT NULL,
  restricoes TEXT,
  mensagem TEXT,
  telefone TEXT,
  status TEXT DEFAULT 'confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comprovantes PIX
CREATE TABLE IF NOT EXISTS comprovantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presente_id UUID REFERENCES presentes(id),
  convidado_nome TEXT,
  url_comprovante TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Inserir dados padrão
INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Políticas e Permissões (Opcional se já existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de configs') THEN
        ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Leitura pública de configs" ON configuracoes FOR SELECT USING (true);
    END IF;
END $$;

GRANT ALL ON TABLE configuracoes TO anon;
GRANT ALL ON TABLE configuracoes TO authenticated;
GRANT ALL ON TABLE configuracoes TO service_role;
