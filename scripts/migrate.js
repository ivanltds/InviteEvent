const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sqlFile = path.join(__dirname, '../docs/architecture/supabase-schema.sql');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Erro: Variável DATABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Iniciando migração do banco de dados (Manual Config)...');
  
  // Regex para extrair dados da URL: postgresql://user:pass@host:port/dbname
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = connectionString.match(regex);

  if (!match) {
    console.error('❌ Erro: Formato de DATABASE_URL inválido.');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  const client = new Client({
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    host,
    port: parseInt(port),
    database,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('📡 Conectado ao banco de dados.');
    
    const schemaSql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Aplicando schema...');
    await client.query(schemaSql);
    
    console.log('✅ Schema aplicado com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
