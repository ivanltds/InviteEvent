import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { eventoId, userId } = await req.json();
    if (!eventoId) return NextResponse.json({ error: 'eventoId obrigatorio' }, { status: 400 });
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token && !userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fallback: Validate via token if user_id not provided by trusted clients
    let uid = userId;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) uid = user.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('sk_test_fake');
    
    if (isMock) {
      console.log('Modo de Teste (Sem Chave Stripe): Ativando automaticamente o evento', eventoId);
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin.from('eventos').update({ is_active: true }).eq('id', eventoId);
      return NextResponse.json({ url: `${baseUrl}/admin/dashboard?payment=success&mock=true` });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Licença InviteEventAI - Evento Ilimitado',
              description: 'Ativação do RSVP online e recursos premium',
            },
            unit_amount: 9900, // R$ 99,00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
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
