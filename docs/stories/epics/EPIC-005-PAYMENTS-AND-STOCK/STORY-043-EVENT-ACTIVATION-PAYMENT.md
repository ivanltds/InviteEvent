# STORY-043: Ativação de Evento via Pagamento (Checkout)

## Descrição
Como um organizador que acabou de criar um evento, desejo realizar o pagamento da taxa de ativação através de um checkout seguro (Stripe/Pix), para que o meu site seja liberado para acesso público pelos convidados.

## Critérios de Aceitação
1. **Status de Ativação:** Adicionar coluna `is_active` (boolean) e `payment_status` na tabela `eventos`.
2. **Barreira de Acesso:** Se `is_active` for falso, a rota `/inv/[slug]` deve exibir uma página de "Site em Manutenção" ou "Aguardando Ativação" para o público.
3. **Integração de Checkout:** Implementar botão "Ativar Site" no Dashboard que redireciona para uma sessão de checkout.
4. **Webhook de Confirmação:** Ao receber a confirmação de pagamento, o sistema deve marcar o evento como ativo automaticamente.

## Valor de Negócio
Garantir a monetização da plataforma e sustentar os custos de infraestrutura.

## Status: 🚀 Ready
