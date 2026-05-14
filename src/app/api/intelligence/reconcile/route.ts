import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Padrão esperado do body: { vendas: [{ token: '...', valor: 100, comissao: 5 }] }
    if (!body || !Array.isArray(body.vendas)) {
      return NextResponse.json({ success: false, error: "Formato inválido. Requer array 'vendas'." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Chama a RPC para bater os tokens e conciliar comissão de telemetria
    const { data, error } = await supabase.rpc('conciliar_vendas_offline', {
      p_vendas: body.vendas
    });

    if (error) {
      console.error('Reconciliation RPC Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Reconcile API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
