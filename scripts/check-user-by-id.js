const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkUser() {
  const client = new Client({
    user: 'postgres.runyitdsxlctoahikkxe',
    password: '37812567Ivt@',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!');
    
    const userId = '0dab4c55-6027-4d62-8361-13f5112f6bc3';
    console.log(`\n--- Usuário ${userId} ---`);
    const user = await client.query('SELECT email FROM auth.users WHERE id = $1', [userId]);
    console.table(user.rows);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
