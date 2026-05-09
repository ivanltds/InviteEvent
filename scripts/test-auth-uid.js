const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testAuthUid() {
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
    
    console.log(`\n--- Testando auth.uid() ---`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`);
    
    const res = await client.query('SELECT auth.uid() as uid');
    console.log('auth.uid():', res.rows[0].uid);
    
    const res2 = await client.query('SELECT current_setting(\'request.jwt.claim.sub\', true) as sub');
    console.log('sub claim:', res2.rows[0].sub);

    const res3 = await client.query('SELECT EXISTS (SELECT 1 FROM public.evento_organizadores WHERE user_id = $1)', [userId]);
    console.log('Existe organizador com este ID (direto):', res3.rows[0].exists);

    const res4 = await client.query('SELECT EXISTS (SELECT 1 FROM public.evento_organizadores WHERE user_id = auth.uid())');
    console.log('Existe organizador com auth.uid():', res4.rows[0].exists);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

testAuthUid();
