# STORY-043: Ativação de Evento via Pagamento (Checkout)

## Descrição
Como um organizador que acabou de criar um evento, desejo realizar o pagamento da taxa de ativação através de um checkout seguro (Stripe), para que o meu site seja liberado para acesso público pelos convidados.

## Critérios de Aceitação
1. **Status de Ativação:** Utilizar colunas `is_active` (boolean) e `payment_status` na tabela `eventos`. [v]
2. **Barreira de Acesso:** Se `is_active` for falso, a rota `/inv/[slug]` deve exibir a página de manutenção via `proxy.ts`. [v]
3. **Botão de Pagamento:** Dashboard deve exibir botão "Pagar Taxa de Ativação" se o evento estiver pendente. [ ]
4. **Integração Stripe:** Redirecionar para Stripe Checkout Session com `eventoId` no metadata. [ ]
5. **Webhook de Confirmação:** Processar `checkout.session.completed` e ativar o evento no Supabase. [ ]
6. **Páginas de Retorno:** Implementar `/admin/checkout/success` e `/admin/checkout/cancel`. [ ]

## Estratégia Técnica
- **API Route:** `src/app/api/checkout/route.ts` para criar a sessão do Stripe.
- **Webhook Route:** `src/app/api/webhooks/stripe/route.ts` para processar notificações do Stripe.
- **Dashboard UI:** Adicionar estado de carregamento e feedback visual para o processo de ativação.
- **Segurança:** Validar a sessão do usuário antes de criar o checkout para garantir que ele é dono do evento.

## Plano de Execução
1. [ ] Criar API Route para Stripe Checkout (`src/app/api/checkout/route.ts`).
2. [ ] Criar Webhook Route para ativação automática (`src/app/api/webhooks/stripe/route.ts`).
3. [ ] Criar componentes de feedback para Success/Cancel.
4. [ ] Integrar botão de ativação no `DashboardPage`.
5. [ ] Testar fluxo completo com Stripe CLI.

## Status: 🏗️ In Progress
