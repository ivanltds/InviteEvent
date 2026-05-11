import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Direct workflow switch override for specific ticket.
 * Body: { mode: 'ai' | 'specialist' }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { mode } = await request.json();

    if (!id || !mode) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes' }, { status: 400 });
    }

    const botActive = mode === 'ai';
    
    // If moving to Specialist, implicitly we can acknowledge that 'human attention' is NOW being given, 
    // so we may optionally toggle 'needs_human_attention = false' here to clear notifications.
    const updates: any = { 
      bot_active: botActive, 
      updated_at: new Date().toISOString() 
    };

    if (!botActive) {
      updates.needs_human_attention = false;
    }

    const { data, error } = await supabase
      .from('suporte_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
