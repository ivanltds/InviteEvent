const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Usando conexão direta. Defina SUPABASE_DB_PASSWORD no .env local — a
// senha em texto puro foi removida em 20/09/2026 (docs/analise/05-privacidade-e-higiene-repo.md, HIG-01).
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Defina SUPABASE_DB_PASSWORD no .env antes de rodar este script.');
  process.exit(1);
}
const directUrl = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.runyitdsxlctoahikkxe.supabase.co:5432/postgres`;

async function listTables() {
  console.log('Tentando conexão direta ao DB...');
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!');
    const res = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log('Tables in public schema:');
    res.rows.forEach(row => console.log(`- ${row.tablename}`));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

listTables();
