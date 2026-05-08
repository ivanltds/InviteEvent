const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkPolicies() {
  const url = process.env.DATABASE_URL;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- POLICIES ATUAIS ---');
    const res = await client.query(`
        SELECT tablename, policyname, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename;
    `);
    console.table(res.rows);

    console.log('\n--- GRANTS PARA ANON ---');
    const grants = await client.query(`
        SELECT table_name, privilege_type
        FROM information_schema.role_table_grants
        WHERE grantee = 'anon' AND table_schema = 'public';
    `);
    console.table(grants.rows);

    console.log('\n--- TABELAS SEM RLS ATIVADO ---');
    const noRls = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false;
    `);
    console.table(noRls.rows);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkPolicies();
