require('dotenv').config();
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

async function checkStripe() {
  console.log('--- 🛡️ Verificador de Configuração Stripe ---');

  // 1. Validar Chave Secreta
  try {
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Conectado ao Stripe: ${account.email || account.id} [Modo: ${account.details_submitted ? 'Produção' : 'Teste'}]`);
  } catch (err) {
    console.error('❌ Erro na STRIPE_SECRET_KEY:', err.message);
    process.exit(1);
  }

  // 2. Verificar Webhook Secret
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET não encontrado no .env.');
  } else {
    console.log('✅ STRIPE_WEBHOOK_SECRET configurado.');
  }

  // 3. Simular Webhook (Opcional)
  const args = process.argv.slice(2);
  if (args.includes('--simulate')) {
    console.log('\n--- 🧪 Simulando Webhook de Ativação ---');
    
    // Buscar um evento de teste no banco
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: evento } = await supabase.from('eventos').select('id, slug').limit(1).single();

    if (!evento) {
      console.error('❌ Nenhum evento encontrado no banco para testar.');
      return;
    }

    console.log(`Simulando pagamento para evento: ${evento.slug} (${evento.id})`);

    // Chamar o webhook localmente via fetch
    const payload = JSON.stringify({
      id: 'evt_test_' + Date.now(),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          metadata: { eventoId: evento.id },
          payment_status: 'paid'
        }
      }
    });

    // Nota: Para simular localmente SEM o Stripe CLI, precisaríamos desabilitar a verificação de assinatura
    // Mas o ideal é usar o Stripe CLI para gerar a assinatura real.
    console.log('Dica: Use "stripe trigger checkout.session.completed" via Stripe CLI para teste real.');
  }
}

checkStripe();
