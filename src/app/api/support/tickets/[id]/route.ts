import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, error: 'status é obrigatório' }, { status: 400 });
    }

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === 'finalizado' || status === 'cancelado') {
      updateData.needs_human_attention = false;
    }

    const { data: ticket, error } = await supabase
      .from('suporte_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
