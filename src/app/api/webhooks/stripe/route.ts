import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
  apiVersion: '2023-10-16' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_fake';

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature falhou.', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const eventoId = session.metadata?.eventoId;

    if (eventoId) {
      // Usa Service Role Key para ignorar RLS e atualizar
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabaseAdmin
        .from('eventos')
        .update({ is_active: true })
        .eq('id', eventoId);

      if (error) {
        console.error('Falha ao ativar evento no BD:', error);
      } else {
        console.log(`Evento ${eventoId} ativado com sucesso após pagamento.`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
