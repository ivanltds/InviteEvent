const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Verificando via SDK Supabase ---');
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*');

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('Total de registros:', data.length);
  if (data.length > 0) {
    data.forEach((row, i) => {
      console.log(`Registro ${i+1}:`, {
        id: row.id,
        chave: row.pix_chave,
        banco: row.pix_banco,
        tipo: row.pix_tipo
      });
    });
  } else {
    console.log('⚠️ Tabela VAZIA!');
  }
}

check();
