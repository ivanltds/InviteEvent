const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  console.log('🚀 Iniciando migração incremental (EPIC-006)...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const sql = `
-- Adicionar colunas de narrativa em configuracoes
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS historia_titulo TEXT DEFAULT 'Nossa História',
ADD COLUMN IF NOT EXISTS historia_subtitulo TEXT DEFAULT 'O Início de Tudo',
ADD COLUMN IF NOT EXISTS historia_texto TEXT DEFAULT 'Tudo começou através de um amigo distante do primo da noiva. O que era para ser apenas um encontro casual se transformou no momento mais importante das nossas vidas. Foi amor à primeira vista. A conexão foi tão forte e imediata que, pouco tempo depois, já estávamos namorando.',
ADD COLUMN IF NOT EXISTS noiva_bio TEXT DEFAULT 'Intensa, forte e decidida. Layslla é o coração vibrante dessa união.',
ADD COLUMN IF NOT EXISTS noivo_bio TEXT DEFAULT 'Paciente, leve e equilibrado. Marcus é o porto seguro e a calmaria que complementa tudo.';

-- Criar tabela de FAQ
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS no FAQ
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Políticas FAQ
DROP POLICY IF EXISTS "Leitura pública de faq" ON faq;
CREATE POLICY "Leitura pública de faq" ON faq FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access faq" ON faq;
CREATE POLICY "Admin full access faq" ON faq FOR ALL USING (true);

-- Grant
GRANT ALL ON faq TO anon, authenticated, service_role;
`;

  try {
    await client.connect();
    console.log('📡 Conectado ao banco de dados.');
    await client.query(sql);
    console.log('✅ Migração EPIC-006 aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  } finally {
    await client.end();
  }
}

migrate();
