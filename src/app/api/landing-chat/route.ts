import { NextResponse } from 'next/server';
import { LandingChatService } from '@/lib/services/landingChatService';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Chat de vendas/orientação da Landing Page (STORY-062). Endpoint público,
 * sem autenticação — visitante é identificado só pelo `sessionId` que o
 * client gera e guarda em localStorage. Nunca aceita dados de outra sessão:
 * toda leitura é filtrada por esse id, via service role no servidor (as
 * tabelas landing_leads/landing_chat_mensagens não dão SELECT a anon/
 * authenticated — ver migration 20260922000000_add_landing_chat_leads.sql).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, message, utm } = body || {};

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId é obrigatório' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ success: false, error: 'message é obrigatório' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: 'Mensagem muito longa' }, { status: 400 });
    }

    const result = await LandingChatService.processMessage(sessionId, message.trim(), utm);

    return NextResponse.json({ success: true, response: result.response });
  } catch (err) {
    console.error('[api/landing-chat] Erro ao processar mensagem:', err);
    return NextResponse.json({ success: false, error: 'Não foi possível processar sua mensagem agora.' }, { status: 500 });
  }
}

/** Restaura o histórico de uma sessão (ex: visitante recarregou a página com o widget aberto). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId é obrigatório' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: lead } = await supabase
      .from('landing_leads')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const { data: messages, error } = await supabase
      .from('landing_chat_mensagens')
      .select('role, conteudo, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (err) {
    console.error('[api/landing-chat] Erro ao buscar histórico:', err);
    return NextResponse.json({ success: false, error: 'Não foi possível carregar a conversa.' }, { status: 500 });
  }
}
