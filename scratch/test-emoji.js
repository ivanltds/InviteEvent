const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testEmoji() {
  const emoji = '💍 Real Wedding 🥂';
  console.log('Testando persistência de emoji:', emoji);
  
  // Usamos id=1 para o singleton de configuracoes
  const { data, error } = await supabase
    .from('configuracoes')
    .update({ whatsapp_template: emoji })
    .eq('id', 1)
    .select();

  if (error) {
    console.error('❌ Erro:', error.message);
  } else {
    console.log('✅ Retorno do Banco:', data[0].whatsapp_template);
    if (data[0].whatsapp_template === emoji) {
      console.log('🚀 Emojis persistidos com sucesso!');
    } else {
      console.log('⚠️ Emojis foram alterados ou perdidos!');
    }
  }
}

testEmoji();
