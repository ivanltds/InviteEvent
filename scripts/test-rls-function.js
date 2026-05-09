const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testFunction() {
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
    
    const userId = '0dab4c55-6027-4d62-8361-13f5112f6bc3'; // ivanltds@gmail.com
    const eventId = '67aa358d-5c76-456b-a55a-c6d208462e7f';
    
    console.log(`\n--- Testando check_is_organizer para usuário ${userId} no evento ${eventId} ---`);
    
    // Simulando auth.uid()
    // Usando local settings para a transação
    await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`);
    
    const res = await client.query('SELECT public.check_is_organizer($1)', [eventId]);
    console.log('Resultado:', res.rows[0].check_is_organizer);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

testFunction();
