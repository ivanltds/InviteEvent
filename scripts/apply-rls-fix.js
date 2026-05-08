const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function applyFix() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260508000000_fix_login_and_creation_rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Usar valores decompostos para evitar problemas de parsing de URL
  const client = new Client({
    user: 'postgres.runyitdsxlctoahikkxe',
    password: process.env.SUPABASE_DB_PASSWORD || '37812567Ivt@',
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Conectando ao banco (Pooler) para aplicar correção de RLS...');
    await client.connect();
    console.log('📡 Conectado.');
    
    await client.query(sql);
    console.log('✅ Políticas de RLS atualizadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro na aplicação da correção:', error.message);
    
    console.log('Tentando conexão direta...');
    const clientDirect = new Client({
      user: 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || '37812567Ivt@',
      host: 'db.runyitdsxlctoahikkxe.supabase.co',
      port: 5432,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await clientDirect.connect();
      console.log('📡 Conectado (Direto).');
      await clientDirect.query(sql);
      console.log('✅ Políticas de RLS atualizadas com sucesso!');
    } catch (err2) {
      console.error('❌ Erro na conexão direta:', err2.message);
      console.log('\n--- SQL para executar MANUALMENTE no SQL Editor do Supabase ---\n');
      console.log(sql);
    } finally {
      await clientDirect.end().catch(() => {});
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyFix();
