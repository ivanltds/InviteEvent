const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRSVP() {
  console.log('--- Testando Acesso Anonimo RSVP ---');
  
  // 1. Tentar ler convites (Slug público)
  const { data: invite, error: err1 } = await supabase
    .from('convites')
    .select('*')
    .limit(1);
  
  if (err1) console.error('❌ Erro ao ler convites:', err1.message);
  else console.log('✅ Leitura de convites OK');

  // 2. Tentar ler membros
  if (invite && invite[0]) {
    const { data: members, error: err2 } = await supabase
      .from('convite_membros')
      .select('*')
      .eq('convite_id', invite[0].id);
    
    if (err2) console.error('❌ Erro ao ler membros:', err2.message);
    else {
      console.log('✅ Leitura de membros OK');
      
      // 3. Tentar ATUALIZAR um membro (Simulando RSVP nominal)
      if (members && members[0]) {
        const { error: err3 } = await supabase
          .from('convite_membros')
          .update({ confirmado: true })
          .eq('id', members[0].id);
        
        if (err3) console.error('❌ Erro ao ATUALIZAR membro (RSVP Nominal):', err3.message);
        else console.log('✅ Atualização de membro OK');
      }
    }

    // 4. Tentar INSERIR na tabela rsvp
    const { error: err4 } = await supabase
      .from('rsvp')
      .insert([{ convite_id: invite[0].id, confirmados: 1, status: 'confirmado' }]);
    
    if (err4) console.error('❌ Erro ao INSERIR RSVP:', err4.message);
    else console.log('✅ Inserção de RSVP OK');
  }
}

testRSVP();
