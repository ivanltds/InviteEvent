import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth/requireMaster';

export async function POST(request: Request) {
  try {
    const guard = await requireMaster();
    if (!guard.authorized) return guard.response;
    const supabase = guard.supabase;

    const body = await request.json();

    // Padrão esperado do body: { vendas: [{ token: '...', valor: 100, comissao: 5 }] }
    if (!body || !Array.isArray(body.vendas)) {
      return NextResponse.json({ success: false, error: "Formato inválido. Requer array 'vendas'." }, { status: 400 });
    }

    // Chama a RPC para bater os tokens e conciliar comissão de telemetria
    // (a RPC também checa check_is_master() internamente — ver migration
    // 20260920100000_security_hardening_rls_privilege_escalation.sql)
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
