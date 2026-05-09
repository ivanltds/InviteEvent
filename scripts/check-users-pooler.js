const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkUsers() {
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
    
    console.log('\n--- Usuários de Auth (via DB) ---');
    const authUsers = await client.query('SELECT id, email, email_confirmed_at FROM auth.users LIMIT 10');
    console.table(authUsers.rows);

    console.log('\n--- Perfis de Usuários ---');
    const profiles = await client.query('SELECT * FROM public.perfis LIMIT 10');
    console.table(profiles.rows);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkUsers();
