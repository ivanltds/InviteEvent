# 🧊 Backlog de Ideias Congeladas
> Ideias tecnicamente viáveis, mas adiadas para sprints futuros.

---

## [FROZEN-001] Webhook de Postback Lomadee para Liberação Automática de Reservas

**Data de congelamento:** 2026-05-14  
**Proposto por:** Operador  
**Status:** CONGELADO — Implementar em sprint futuro

### Contexto
Quando um convidado clica em um link de presente externo (ex: Amazon via Lomadee) e efetua a compra, o sistema mantém um lock temporário de 3h que expira naturalmente. A ideia é usar o **Postback da Lomadee** para liberar esse lock imediatamente na conversão.

### Por que foi congelado
- A API de postback da Lomadee **não retorna o token de sessão** (`source=AEG-xxx`) do convidado — apenas dados genéricos da transação (produto, valor, comissão).
- Se dois convidados tiverem lock simultâneo no mesmo produto, **o sistema não consegue identificar qual deles comprou**, tornando o postback ambíguo.
- Para o contexto de lista de presentes de casamento, o lock de 3h + Reconciliação CSV já cobrem o caso de uso com exatidão.

### Pré-requisitos para implementar no futuro
1. Verificar se a Lomadee suporta envio de `sub_id` customizado no postback (variável `{SUB_ID}` ou similar).
2. Se suportado: o token `AEG-xxx` poderia ser injetado no link e retornado no postback — resolvendo o problema de ambiguidade.
3. Criar a migration da RPC `liberar_lock_por_token(p_token text)`.
4. Criar a rota `src/app/api/webhooks/lomadee/route.ts`.
5. Configurar URL no painel da SocialSoul: `https://app.invite-event.com.br/api/webhooks/lomadee?token={SUB_ID}&produto={PRODUCT_NAME}&valor={SALE_AMOUNT}`.

### Arquivos que serão criados
- `src/app/api/webhooks/lomadee/route.ts`
- Migration: `liberar_lock_por_token`
- Teste: `src/__tests__/webhooks/lomadee.test.ts`

---
