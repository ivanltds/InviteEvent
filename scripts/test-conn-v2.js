const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Defina SUPABASE_DB_PASSWORD no .env local — a senha em texto puro foi
// removida em 20/09/2026 (docs/analise/05-privacidade-e-higiene-repo.md, HIG-01).
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Defina SUPABASE_DB_PASSWORD no .env antes de rodar este script.');
  process.exit(1);
}
const url = `postgresql://postgres.runyitdsxlctoahikkxe:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;

async function test() {
  console.log('Testing with aws-1 pooler...');
  const client = new Client({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected!');
    const res = await client.query('SELECT 1');
    console.log('Result:', res.rows);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
