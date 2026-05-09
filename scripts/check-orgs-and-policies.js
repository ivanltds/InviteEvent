const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkEventOrgs() {
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
    
    const eventId = '67aa358d-5c76-456b-a55a-c6d208462e7f';
    console.log(`\n--- Organizadores do Evento ${eventId} ---`);
    const orgs = await client.query('SELECT * FROM public.evento_organizadores WHERE evento_id = $1', [eventId]);
    console.table(orgs.rows);

    const res = await client.query('SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = \'convites\'');
    console.log('\n--- Políticas de Convites ---');
    console.table(res.rows);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkEventOrgs();
