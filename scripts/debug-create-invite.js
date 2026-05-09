const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCreateInvite() {
  const eventId = '67aa358d-5c76-456b-a55a-c6d208462e7f'; // Ivan e Bianca
  
  console.log('Tentando criar convite anonimamente...');
  const { data, error } = await supabase
    .from('convites')
    .insert([{
      evento_id: eventId,
      nome_principal: 'Teste Debug',
      limite_pessoas: 2,
      slug: 'teste-debug-' + Math.random().toString(36).substring(7),
      tipo: 'individual'
    }]);

  if (error) {
    console.error('ERRO AO CRIAR CONVITE:', error);
  } else {
    console.log('SUCESSO:', data);
  }
}

testCreateInvite();
