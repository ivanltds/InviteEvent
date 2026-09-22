import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { eventoId } = await req.json();
    if (!eventoId) return NextResponse.json({ error: 'eventoId obrigatorio' }, { status: 400 });
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    // Correção de 20/09/2026: antes, um `userId` mandado direto no corpo da
    // requisição (sem token nenhum) era aceito como identidade válida. Agora
    // exigimos sempre uma sessão real.
    if (!token) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    const uid = user.id;
    const uemail = user.email || '';

    // Correção de 20/09/2026: garante que quem está pagando é de fato
    // organizador do evento que será ativado — antes, o eventoId do corpo
    // da requisição era aceito sem checar posse nenhuma.
    const { data: isOrganizer } = await supabase.rpc('check_is_organizer', { p_evento_id: eventoId });
    if (!isOrganizer) {
      return NextResponse.json({ error: 'Você não é organizador deste evento.' }, { status: 403 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Correção de 20/09/2026 (docs/analise/01-seguranca.md, SEG-crítico /
    // docs/analise/03-testes.md, TST-02): esta rota ativava o evento como
    // pago sem nenhuma cobrança real sempre que STRIPE_SECRET_KEY estivesse
    // ausente — que é exatamente o estado da Vercel de produção hoje. Isso
    // liberava a licença de graça para qualquer pessoa. O "modo mock" só é
    // permitido agora fora de produção e com uma flag explícita, nunca
    // inferido da falta de uma chave.
    const allowMockCheckout =
      process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_CHECKOUT === 'true';

    if (allowMockCheckout) {
      console.log('Modo de Teste (ALLOW_MOCK_CHECKOUT=true, fora de produção): Ativando automaticamente o evento', eventoId);
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin.from('eventos').update({ is_active: true }).eq('id', eventoId);
      return NextResponse.json({ url: `${baseUrl}/admin/dashboard?payment=success&mock=true` });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Checkout] STRIPE_SECRET_KEY não configurada — recusando ativar evento sem pagamento real.');
      return NextResponse.json(
        { error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' },
        { status: 503 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Licença Celebraê - Evento Ilimitado',
              description: 'Ativação do RSVP online e recursos premium',
            },
            unit_amount: 50, // Mínimo permitido pelo Stripe: R$ 0.50 para Testes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: uemail || undefined,
      billing_address_collection: 'required',
      metadata: {
        eventoId: eventoId,
        userId: uid
      },
      success_url: `${baseUrl}/admin/dashboard?payment=success`,
      cancel_url: `${baseUrl}/admin/pagamentos?payment=cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
