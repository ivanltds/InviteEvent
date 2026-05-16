import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
}

// POST: Adiciona um item base ou múltiplos itens na fila de cura de links quebrados
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body; // Array de { id, link, nome } ou payload direto
    const supabase = getSupabaseClient();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'É necessário enviar um array com pelo menos um item para enfileirar.' }, { status: 400 });
    }

    const baseIds = items.map(i => i.id).filter(id => id && id.length === 36);

    // 1. Busca itens que já estão na fila com status PENDENTE para evitar duplicidade
    const { data: existingPending } = await supabase
      .from('fila_ajuste_links')
      .select('presente_base_id')
      .in('presente_base_id', baseIds)
      .eq('status', 'PENDENTE');

    const pendingIds = new Set(existingPending?.map(p => p.presente_base_id) || []);
    
    // 2. Filtra os itens que NÃO estão na fila
    const itemsToInsert = items.filter(item => !pendingIds.has(item.id));

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Os itens selecionados já estão na Fila de Cura aguardando o processamento do Daemon.',
        count: 0
      });
    }

    // 3. Prepara payloads de inserção
    const records = itemsToInsert.map(item => ({
      presente_base_id: item.id,
      link_quebrado: item.link || 'Link desconhecido/não cadastrado',
      motivo_quebra: 'SOLICITAÇÃO MANUAL - OPERADOR MASTER',
      status: 'PENDENTE',
      logs_cura: [{ timestamp: new Date().toISOString(), log: 'Item enfileirado manualmente via Console Administrativo.' }]
    }));

    const { error } = await supabase
      .from('fila_ajuste_links')
      .insert(records);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${records.length} novos itens adicionados à Fila de Cura. O Daemon Autônomo iniciará o processamento no próximo ciclo.`,
      count: records.length
    });

  } catch (error: any) {
    console.error('[API POST BulkCurate] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
