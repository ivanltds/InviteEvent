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

    // Prepara payloads de inserção
    const records = items.map(item => ({
      presente_base_id: item.id,
      link_quebrado: item.link || 'Link desconhecido/não cadastrado',
      motivo_quebra: 'SOLICITAÇÃO MANUAL - OPERADOR MASTER',
      status: 'PENDENTE',
      logs_cura: [{ timestamp: new Date().toISOString(), log: 'Item enfileirado manualmente via Console Administrativo.' }]
    }));

    const { data, error } = await supabase
      .from('fila_ajuste_links')
      .insert(records)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${data?.length || 0} itens adicionados com sucesso na Fila de Cura. O Daemon Autônomo iniciará o processamento no próximo ciclo.`,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('[API POST BulkCurate] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
