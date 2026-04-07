const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function debug() {
  const url = process.env.DATABASE_URL;
  console.log('--- Debug de Conexão ---');
  console.log('Host:', url.split('@')[1]);
  
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!');
    const res = await client.query('SELECT current_user, current_database()');
    console.log('Usuário:', res.rows[0].current_user);
    console.log('Database:', res.rows[0].current_database);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

debug();
