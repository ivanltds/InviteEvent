
const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    const projectRef = 'runyitdsxlctoahikkxe';
    const passwords = ['378125Ivt@', '37812567Ivt', '37812567Ivt@'];
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
