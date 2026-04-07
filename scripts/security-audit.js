const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log('🔍 Iniciando Auditoria de Segurança (RLS Test)...');

  // Teste 1: Tentar deletar um presente (Deve falhar)
  console.log('\n--- Teste 1: Deleção de Presente (Anon) ---');
  const { error: deleteError } = await supabase
    .from('presentes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Tenta deletar tudo
  
  if (deleteError) {
    console.log('✅ Bloqueado com sucesso:', deleteError.message);
  } else {
    console.log('❌ ERRO: Anon conseguiu executar comando de deleção!');
  }

  // Teste 2: Tentar ver todos os convites (Deve falhar ou retornar vazio dependendo da policy)
  // Nota: Nossa policy permite SELECT público para convites, mas vamos ver se conseguimos atualizar
  console.log('\n--- Teste 2: Atualização de Convite (Anon) ---');
  const { error: updateError } = await supabase
    .from('convites')
    .update({ nome_principal: 'HACKED' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (updateError) {
    console.log('✅ Bloqueado com sucesso:', updateError.message);
  } else {
    console.log('❌ ERRO: Anon conseguiu atualizar convites!');
  }

  // Teste 3: Tentar inserir um presente diretamente (Deve falhar se a policy de admin for FOR ALL e check user)
  // Nota: Atualmente nossa policy de Admin usa ALL USING (true). Isso é perigoso com a anon key!
  console.log('\n--- Teste 3: Inserção de Presente (Anon) ---');
  const { error: insertError } = await supabase
    .from('presentes')
    .insert([{ nome: 'Presente Malicioso', preco: 0 }]);

  if (insertError) {
    console.log('✅ Bloqueado com sucesso:', insertError.message);
  } else {
    console.log('❌ AVISO: Anon conseguiu inserir um presente. Isso é esperado no protótipo (Anon = Admin), mas deve ser alterado para produção.');
  }

  console.log('\nAudit finalizado.');
}

runAudit();
