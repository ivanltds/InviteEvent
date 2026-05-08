const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function backup() {
  const url = process.env.DATABASE_URL;
  // Try with the password from DATABASE_URL first
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database for backup');
    
    const res = await client.query(`
      SELECT policyname, tablename, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    
    console.log('Current Policies:');
    console.table(res.rows);
    
    const fs = require('fs');
    fs.writeFileSync('policies_backup.json', JSON.stringify(res.rows, null, 2));
    console.log('✅ Backup saved to policies_backup.json');
    
  } catch (err) {
    console.error('❌ Error during backup:', err.message);
    if (err.message.includes('Tenant or user not found') || err.message.includes('password authentication failed')) {
        console.log('Trying with SUPABASE_DB_PASSWORD...');
        const altUrl = url.replace(/postgres\.runyitdsxlctoahikkxe:[^@]+@/, `postgres.runyitdsxlctoahikkxe:${process.env.SUPABASE_DB_PASSWORD}@`);
        const client2 = new Client({
            connectionString: altUrl,
            ssl: { rejectUnauthorized: false }
        });
        try {
            await client2.connect();
            console.log('✅ Connected to database using SUPABASE_DB_PASSWORD');
            const res = await client2.query(`
                SELECT policyname, tablename, cmd, roles, qual, with_check 
                FROM pg_policies 
                WHERE schemaname = 'public'
            `);
            console.table(res.rows);
            const fs = require('fs');
            fs.writeFileSync('policies_backup.json', JSON.stringify(res.rows, null, 2));
            console.log('✅ Backup saved to policies_backup.json');
        } catch (err2) {
            console.error('❌ Error with alternative password:', err2.message);
        } finally {
            await client2.end();
        }
    }
  } finally {
    await client.end();
  }
}

backup();
