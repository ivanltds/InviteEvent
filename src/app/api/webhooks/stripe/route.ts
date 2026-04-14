import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicializa Stripe com a versão recomendada
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * WEBHOOK: /api/webhooks/stripe
 * 
 * Processa eventos do Stripe (ex: checkout.session.completed) para:
 * 1. Ativar licença de eventos (is_active = true)
 * 2. Processar contribuições de presentes (futuro)
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
    console.error('[Stripe Webhook] Falta assinatura ou segredo do endpoint.');
    return NextResponse.json({ error: 'Configuracao incompleta' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Erro de assinatura: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type} [${event.id}]`);

  // 1. Processar Sessão de Checkout Concluída
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Metadados identificam a origem da transação
    const eventoId = session.metadata?.eventoId;
    const presenteId = session.metadata?.presenteId; // Futuro suporte a presentes via Stripe
    const convidadoNome = session.metadata?.convidadoNome || 'Convidado via Stripe';

    // Cliente Admin para bypass no RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // CASO A: Ativação de Licença do Evento
    if (eventoId && !presenteId) {
      console.log(`[Stripe Webhook] Ativando licença para Evento: ${eventoId}`);
      
      const { error } = await supabaseAdmin
        .from('eventos')
        .update({ 
          is_active: true,
          payment_status: 'paid'
        })
        .eq('id', eventoId);

      if (error) {
        console.error(`[Stripe Webhook] Erro ao ativar evento ${eventoId}:`, error);
      } else {
        console.log(`[Stripe Webhook] Evento ${eventoId} ativado e pago com sucesso.`);
      }
    }

    // CASO B: Pagamento de Presente (Contribuição em Dinheiro via Stripe)
    if (presenteId) {
      console.log(`[Stripe Webhook] Processando presente ${presenteId} para evento ${eventoId}`);
      
      // Criar um registro na tabela de comprovantes para manter histórico
      const { error: compError } = await supabaseAdmin
        .from('comprovantes')
        .insert({
          presente_id: presenteId,
          convidado_nome: convidadoNome,
          url_comprovante: `stripe_session_${session.id}`, // Identificador da transação
          created_at: new Date().toISOString()
        });

      if (compError) {
        console.error(`[Stripe Webhook] Erro ao registrar comprovante de presente:`, compError);
      }

      // Opcional: Atualizar status do presente se necessário
      // (Alguns presentes admitem múltiplas contribuições, outros esgotam)
    }
  }

  return NextResponse.json({ received: true });
}

