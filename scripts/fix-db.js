const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Erro: DATABASE_URL não configurada no .env');
  process.exit(1);
}

async function fixDatabase() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260407020000_fix_missing_tables_and_columns.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Regex para extrair dados da URL: postgresql://user:pass@host:port/dbname
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = connectionString.match(regex);

  let clientConfig;
  if (match) {
    const [, user, password, host, port, database] = match;
    clientConfig = {
      user: decodeURIComponent(user),
      password: decodeURIComponent(password),
      host,
      port: parseInt(port),
      database,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    clientConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false }
    };
  }

  const client = new Client(clientConfig);

  try {
    console.log('🚀 Conectando ao banco para correção final...');
    await client.connect();
    console.log('📡 Conectado.');
    
    await client.query(sql);
    console.log('✅ Banco de dados atualizado com sucesso (Tabela FAQ e novas colunas)!');
  } catch (error) {
    console.error('❌ Erro na correção do banco:', error.message);
    console.log('\n--- SQL para executar MANUALMENTE no SQL Editor do Supabase ---\n');
    console.log(sql);
    console.log('\n--------------------------------------------------------------\n');
  } finally {
    await client.end();
  }
}

fixDatabase();
