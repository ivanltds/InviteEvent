import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'ticketId é obrigatório' }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('suporte_mensagens')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ticket_id, remetente_id, conteudo } = await request.json();

    if (!ticket_id || !remetente_id || !conteudo) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('suporte_mensagens')
      .insert([{ ticket_id, remetente_id, conteudo }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Phase 2: Integrazione Intelligente Híbrida (PRD-009)
    // 1. Verificar se o remetente é Master ou Usuário
    const { data: perfil } = await supabase
      .from('perfis')
      .select('is_master')
      .eq('id', remetente_id)
      .single();

    const isMaster = perfil?.is_master || false;

    // Se for MASTER enviando, não ativamos o Bot
    if (!isMaster) {
      // Acionamento Seguro do Orquestrador em Background/Async
      import('@/lib/services/aiSupportService').then(async ({ AISupportService }) => {
        const aiResult = await AISupportService.processMessage(ticket_id, conteudo);
        
        if (aiResult.active && aiResult.response) {
          // Salva a resposta do Bot na tabela de mensagens
          await supabase
            .from('suporte_mensagens')
            .insert([{
              ticket_id: ticket_id,
              remetente_id: '00000000-0000-0000-0000-000000000000', // ID Simbólico reservado ao Sistema/Bot
              conteudo: aiResult.response
            }]);
        }
      }).catch(err => console.error('[AI Hook Fail]', err));
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
