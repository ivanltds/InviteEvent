const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function applyFixViaPooler() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260508500000_fix_rls_recursion_v6.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Supabase Pooler: O host do pooler requer o formato 'postgres.ref' no USERNAME para roteamento correto.
  const client = new Client({
    user: 'postgres.runyitdsxlctoahikkxe',
    password: '37812567Ivt@', // Senha literal para evitar erros de shell/env
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Tentando conexão via Supabase Pooler (aws-0-sa-east-1)...');
    await client.connect();
    console.log('📡 Conectado com sucesso ao Pooler!');
    
    console.log('📝 Aplicando correções de RLS...');
    await client.query(sql);
    console.log('✅ Políticas de RLS atualizadas com sucesso via script!');

  } catch (error) {
    console.error('❌ Erro no Pooler aws-0:', error.message);
    
    console.log('Tentando host alternativo (aws-1)...');
    const clientAlt = new Client({
      user: 'postgres.runyitdsxlctoahikkxe',
      password: '37812567Ivt@',
      host: 'aws-1-sa-east-1.pooler.supabase.com',
      port: 5432, // Tentando porta 5432 no host do pooler (as vezes funciona como passthrough)
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await clientAlt.connect();
      console.log('📡 Conectado (aws-1).');
      await clientAlt.query(sql);
      console.log('✅ Políticas de RLS atualizadas com sucesso!');
    } catch (err2) {
      console.error('❌ Erro no host alternativo:', err2.message);
      
      console.log('Tentando via IP direto (extraído do DNS)...');
      const clientIp = new Client({
        user: 'postgres.runyitdsxlctoahikkxe',
        password: '37812567Ivt@',
        host: '54.94.90.106', // IP de aws-0-sa-east-1
        port: 6543,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await clientIp.connect();
        console.log('📡 Conectado via IP direto!');
        await clientIp.query(sql);
        console.log('✅ Políticas de RLS atualizadas com sucesso!');
      } catch (err3) {
        console.error('❌ Erro via IP direto:', err3.message);
      } finally {
        await clientIp.end().catch(() => {});
      }
    } finally {
      await clientAlt.end().catch(() => {});
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyFixViaPooler();
