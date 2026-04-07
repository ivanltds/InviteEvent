-- Migração de Sincronização de Colunas

-- 1. Atualizando a tabela 'presentes'
ALTER TABLE presentes ADD COLUMN IF NOT EXISTS quantidade_total INTEGER DEFAULT 1;
ALTER TABLE presentes ADD COLUMN IF NOT EXISTS quantidade_reservada INTEGER DEFAULT 0;

-- 2. Atualizando a tabela 'configuracoes'
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pix_banco TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pix_nome TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS mostrar_historia BOOLEAN DEFAULT true;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS mostrar_noivos BOOLEAN DEFAULT true;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS mostrar_faq BOOLEAN DEFAULT true;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS mostrar_presentes BOOLEAN DEFAULT true;

-- 3. Garantindo que a tabela 'comprovantes' existe (esta é nova, então CREATE TABLE funciona)
CREATE TABLE IF NOT EXISTS comprovantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presente_id UUID REFERENCES presentes(id),
  convidado_nome TEXT,
  url_comprovante TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Atualizando o cache do PostgREST novamente por segurança
NOTIFY pgrst, 'reload schema';
