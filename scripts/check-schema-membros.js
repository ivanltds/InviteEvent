const { Client } = require('pg');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkSchema() {
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
    
    console.log(`\n--- Colunas de convite_membros ---`);
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'convite_membros'
    `);
    console.table(res.rows);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
