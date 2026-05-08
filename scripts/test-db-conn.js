
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    console.log('Testing DATABASE_URL from .env with NODE_TLS_REJECT_UNAUTHORIZED=0...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('SUCCESS connecting with DATABASE_URL');
        const res = await client.query('SELECT current_user, current_database()');
        console.log('Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('FAILED with DATABASE_URL:', err.message);
    }
}

test();
