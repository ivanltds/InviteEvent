
const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const projectRef = 'runyitdsxlctoahikkxe';
    // Antes deste script tinha 3 senhas reais em texto puro (variantes de
    // adivinhação). Removidas em 20/09/2026 — defina SUPABASE_DB_PASSWORD
    // no .env local (docs/analise/05-privacidade-e-higiene-repo.md, HIG-01).
    if (!process.env.SUPABASE_DB_PASSWORD) {
        console.error('Defina SUPABASE_DB_PASSWORD no .env antes de rodar este script.');
        process.exit(1);
    }
    const passwords = [process.env.SUPABASE_DB_PASSWORD];
    const hosts = [
        'aws-1-sa-east-1.pooler.supabase.com',
        'aws-0-sa-east-1.pooler.supabase.com',
        `db.${projectRef}.supabase.co`
    ];
    const ports = [5432, 6543];

    for (const host of hosts) {
        for (const port of ports) {
            for (const pwd of passwords) {
                console.log(`Testing: ${host}:${port} with user postgres.${projectRef} and password ${pwd}`);
                const client = new Client({
                    host,
                    port,
                    user: `postgres.${projectRef}`,
                    password: pwd,
                    database: 'postgres',
                    ssl: { rejectUnauthorized: false },
                    connectionTimeoutMillis: 3000
                });

                try {
                    await client.connect();
                    console.log('✅ SUCCESS!');
                    const res = await client.query('SELECT current_user, current_database()');
                    console.log('Info:', res.rows[0]);
                    await client.end();
                    return;
                } catch (err) {
                    console.error('❌ FAILED:', err.message);
                }
            }
        }
    }
}

run();
