import { eventService } from '../src/lib/services/eventService';
import { giftService } from '../src/lib/services/giftService';
import { supabase } from '../src/lib/supabase';

async function verify() {
  console.log('--- Verificando Cálculo de Presentes ---');
  
  // 1. Pegar um evento ativo
  const { data: event } = await supabase.from('eventos').select('id').limit(1).single();
  if (!event) {
    console.error('Nenhum evento encontrado para teste.');
    return;
  }
  
  console.log(`Evento: ${event.id}`);

  // 2. Pegar stats iniciais
  const statsBefore = await eventService.getEventStats(event.id);
  console.log('Stats Antes:', statsBefore);

  // 3. Criar um presente e um comprovante fake
  const { data: gift } = await supabase.from('presentes').insert({
    evento_id: event.id,
    nome: 'Teste de Valor Dashboard',
    preco: 123.45,
    quantidade_total: 1,
    status: 'disponivel'
  }).select().single();

  if (!gift) {
    console.error('Erro ao criar presente de teste.');
    return;
  }

  const { error: compError } = await supabase.from('comprovantes').insert({
    presente_id: gift.id,
    convidado_nome: 'Testador',
    url_comprovante: 'http://teste.com/comprovante.jpg'
  });

  if (compError) {
    console.error('Erro ao criar comprovante de teste:', compError);
    return;
  }

  // 4. Pegar stats depois
  const statsAfter = await eventService.getEventStats(event.id);
  console.log('Stats Depois:', statsAfter);

  if (statsAfter.valorPresentes === statsBefore.valorPresentes + 123.45) {
    console.log('✅ SUCESSO: O valor foi incrementado corretamente!');
  } else {
    console.error(`❌ FALHA: Valor esperado ${statsBefore.valorPresentes + 123.45}, mas obteve ${statsAfter.valorPresentes}`);
  }

  // Cleanup
  await supabase.from('presentes').delete().eq('id', gift.id);
}

verify();
