import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');

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
    const { usuario_id, evento_id } = await request.json();

    if (!usuario_id) {
      return NextResponse.json({ success: false, error: 'usuario_id é obrigatório' }, { status: 400 });
    }

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
