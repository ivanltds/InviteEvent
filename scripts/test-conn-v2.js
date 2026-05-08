const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Usando URL encontrada no temp, com a senha do .env
const url = 'postgresql://postgres.runyitdsxlctoahikkxe:37812567Ivt@aws-1-sa-east-1.pooler.supabase.com:5432/postgres';

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
