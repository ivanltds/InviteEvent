import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseServerClient } from '@/lib/supabase-server';

// Correção de 20/09/2026 (docs/analise/01-seguranca.md, SEG-06): esta rota
// listava e criava tickets de suporte de QUALQUER usuário sem exigir login,
// bastava adivinhar/informar um usuarioId. Agora exige sessão válida e, para
// quem não é master, só permite ver/criar os próprios tickets — nunca os de
// outra pessoa, mesmo que o usuarioId do corpo/query seja diferente.
export async function GET(request: Request) {
  try {
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const { data: isMaster } = await supabaseAuth.rpc('check_is_master');

    const { searchParams } = new URL(request.url);
    const requestedUsuarioId = searchParams.get('usuarioId');
    // Master pode filtrar por qualquer usuarioId (ou ver todos, sem filtro);
    // qualquer outra pessoa só enxerga os próprios tickets.
    const usuarioId = isMaster ? requestedUsuarioId : user.id;

    let query = supabase
      .from('suporte_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { evento_id } = body;
    // Ignora qualquer usuario_id vindo do corpo — o ticket é sempre criado
    // em nome de quem está autenticado, nunca de quem o body diz que é.
    const usuario_id = user.id;

    const insertData: any = { usuario_id, status: 'aguardando_atendimento' };
    if (evento_id && typeof evento_id === 'string' && evento_id.trim() !== '') {
      insertData.evento_id = evento_id;
    }

    const { data: ticket, error } = await supabase
      .from('suporte_tickets')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
