const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

// Constrói a URL direta a partir da URL do pooler
// De: postgresql://postgres.ref:pass@aws-pooler.supabase.com:6543/postgres
// Para: postgresql://postgres.ref:pass@db.ref.supabase.co:5432/postgres
const directUrl = dbUrl
  .replace(':6543', ':5432')
  .replace('aws-0-sa-east-1.pooler.supabase.com', 'db.runyitdsxlctoahikkxe.supabase.co');

async function fix() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260407020000_fix_missing_tables_and_columns.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Tentando conexão direta via URL reconstruída...');
  
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado diretamente!');
    await client.query(sql);
    console.log('✅ Migração aplicada com sucesso!');
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
    console.log('\n💡 Dica: Se o erro for de senha, verifique se ela foi alterada recentemente no painel do Supabase.');
  } finally {
    await client.end();
  }
}

fix();
