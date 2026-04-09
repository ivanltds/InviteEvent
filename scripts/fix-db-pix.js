const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function fix() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Reparando Banco de Dados ---');
    
    // 1. Garantir que a coluna pix_tipo existe
    console.log('Verificando/Criando coluna pix_tipo...');
    await client.query(`
      ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pix_tipo TEXT DEFAULT 'cpf';
    `);

    // 2. Garantir que o registro 1 tenha um tipo definido
    console.log('Populando dados padrão...');
    await client.query(`
      UPDATE configuracoes SET pix_tipo = 'cpf' WHERE pix_tipo IS NULL;
    `);

    // 3. Resetar/Reforçar política de leitura pública
    console.log('Reforçando política de RLS...');
    await client.query(`
      DROP POLICY IF EXISTS "Leitura pública de configs" ON configuracoes;
      CREATE POLICY "Leitura pública de configs" ON configuracoes FOR SELECT USING (true);
    `);

    // 4. Garantir Grants
    await client.query(`
      GRANT SELECT ON configuracoes TO anon;
      GRANT SELECT ON configuracoes TO authenticated;
    `);

    console.log('✅ Reparo concluído com sucesso!');

  } catch (err) {
    console.error('❌ Erro durante o reparo:', err.message);
  } finally {
    await client.end();
  }
}

fix();
