import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// Correção de 20/09/2026 (docs/analise/01-seguranca.md, SEG-06): esta rota
// deixava ler e enviar mensagens de QUALQUER ticket sem login, e o
// remetente_id do envio vinha do corpo da requisição sem checagem —
// qualquer um podia se passar por outra pessoa (inclusive fingir ser
// master). Agora exige sessão e só permite acesso ao dono do ticket ou a
// um master.
async function authorizeTicketAccess(ticketId: string) {
  const supabaseAuth = await getSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 }) };
  }

  const { data: isMaster } = await supabaseAuth.rpc('check_is_master');

  if (!isMaster) {
    const { data: ticket } = await supabase
      .from('suporte_tickets')
      .select('usuario_id')
      .eq('id', ticketId)
      .single();

    if (!ticket || ticket.usuario_id !== user.id) {
      return { ok: false as const, response: NextResponse.json({ success: false, error: 'Acesso negado a este ticket.' }, { status: 403 }) };
    }
  }

  return { ok: true as const, userId: user.id, isMaster: !!isMaster };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'ticketId é obrigatório' }, { status: 400 });
    }

    const auth = await authorizeTicketAccess(ticketId);
    if (!auth.ok) return auth.response;

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
    const { ticket_id, conteudo } = await request.json();

    if (!ticket_id || !conteudo) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const auth = await authorizeTicketAccess(ticket_id);
    if (!auth.ok) return auth.response;
    // remetente_id nunca vem do corpo da requisição — é sempre quem está autenticado.
    const remetente_id = auth.userId;
    const isMaster = auth.isMaster;

    const { data: message, error } = await supabase
      .from('suporte_mensagens')
      .insert([{ ticket_id, remetente_id, conteudo }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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
