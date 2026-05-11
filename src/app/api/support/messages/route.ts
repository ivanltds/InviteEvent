import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    console.log('--- BOT DEBUG START ---');
    console.log('[MESSAGES API] isMaster:', isMaster, 'ticket_id:', ticket_id);

    // Se for MASTER enviando, não ativamos o Bot
    if (!isMaster) {
      try {
        console.log('[MESSAGES API] Importando AISupportService... [Cache Buster v2]');
        const { AISupportService } = await import('@/lib/services/aiSupportService');
        
        console.log('[MESSAGES API] Chamando processMessage...');
        const aiResult = await AISupportService.processMessage(ticket_id, conteudo);
        
        console.log('[MESSAGES API] Resultado AI:', JSON.stringify(aiResult));

        if (aiResult && aiResult.active && aiResult.response) {
          console.log('[MESSAGES API] Inserindo resposta no Banco...');
          const insertRes = await supabase
            .from('suporte_mensagens')
            .insert([{
              ticket_id: ticket_id,
              remetente_id: '00000000-0000-0000-0000-000000000000', // ID Simbólico
              conteudo: aiResult.response
            }]);
          
          console.log('[MESSAGES API] Resultado Insert:', insertRes.error ? insertRes.error : 'OK');
        }
      } catch (aiErr) {
        console.error('[MESSAGES API] AI Hook Fail:', aiErr);
      }
    }
    console.log('--- BOT DEBUG END ---');

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
