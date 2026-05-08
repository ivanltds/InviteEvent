const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function applyFixViaPooler() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260508000000_fix_login_and_creation_rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Credenciais do Pooler (Porta 6543)
  const client = new Client({
    user: 'postgres.runyitdsxlctoahikkxe',
    password: process.env.SUPABASE_DB_PASSWORD || '37812567Ivt@',
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Tentando conexão via Supabase Pooler (Porta 6543)...');
    await client.connect();
    console.log('📡 Conectado com sucesso ao Pooler!');
    
    console.log('📝 Aplicando correções de RLS...');
    await client.query(sql);
    console.log('✅ Políticas de RLS atualizadas com sucesso via script!');
    
    // Verificação rápida
    const res = await client.query("SELECT policyname FROM pg_policies WHERE tablename = 'perfis' AND policyname = 'Usuários atualizam seu próprio perfil'");
    if (res.rows.length > 0) {
      console.log('🔍 Verificação: Política confirmada no banco.');
    }

  } catch (error) {
    console.error('❌ Falha na conexão/execução via Pooler:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.log('💡 Dica: Verifique se o usuário "postgres.runyitdsxlctoahikkxe" está correto para este projeto.');
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyFixViaPooler();
