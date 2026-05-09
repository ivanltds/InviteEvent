import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    // Busca do Supabase usando client padrão
    const { data: tickets, error } = await supabase
      .from('suporte_tickets')
      .select('*')
      .order('created_at', { ascending: false });

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

    const { data: ticket, error } = await supabase
      .from('suporte_tickets')
      .insert([{ usuario_id, evento_id, status: 'aguardando_atendimento' }])
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
