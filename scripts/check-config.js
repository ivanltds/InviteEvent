const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Verificando Tabela configuracoes ---');
    
    // Ver estrutura
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'configuracoes';
    `);
    console.log('Colunas encontradas:', columns.rows.map(r => r.column_name).join(', '));

    // Ver dados
    const data = await client.query('SELECT * FROM configuracoes;');
    console.log('Total de registros:', data.rowCount);
    
    if (data.rowCount > 0) {
      data.rows.forEach((row, i) => {
        console.log(`Registro ${i+1} (ID: ${row.id}):`);
        console.log(` - Chave PIX: ${row.pix_chave || 'VAZIO'}`);
        console.log(` - Banco PIX: ${row.pix_banco || 'VAZIO'}`);
        console.log(` - Tipo PIX: ${row.pix_tipo || 'VAZIO'}`);
      });
    } else {
      console.log('⚠️ Tabela configuracoes está VAZIA!');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

check();
