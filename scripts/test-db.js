const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function test() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão OK!');
    const res = await client.query('SELECT current_user, current_database();');
    console.log('Dados:', res.rows[0]);
  } catch (err) {
    console.error('❌ Falha na conexão:', err.message);
  } finally {
    await client.end();
  }
}

test();
