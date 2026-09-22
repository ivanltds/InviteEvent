# STORY-062: Chat de Vendas/Orientação na Landing Page

## Descrição
Como visitante indeciso na Landing Page, desejo poder tirar dúvidas sobre o InviteEvent num chat, para entender as possibilidades do produto antes de decidir se crio meu convite. Como dono do produto, desejo capturar e-mail/WhatsApp de quem demonstra interesse real, para poder fazer follow-up de vendas.

## Contexto / Decisão de Arquitetura
Já existe uma infra de suporte pós-login (`FloatingChatWidget`, `suporte_tickets`/`suporte_mensagens`, `aiSupportService.ts` com OpenAI `gpt-4o-mini`), mas ela exige usuário autenticado (`usuario_id UUID NOT NULL REFERENCES auth.users`) e tem handoff humano. Decisão (validada com o dono do produto): **não reaproveitar** — construir um assistente novo, mais leve, sem ticket, sem handoff humano, para visitante anônimo.

**Nota de segurança separada:** as RLS de `suporte_tickets`/`suporte_mensagens`/`issues` são `USING (true)` totalmente abertas pra `anon`/`authenticated` — a segurança real hoje está só nas API routes, não no banco. As tabelas novas desta story foram desenhadas com RLS restritiva desde o início (só INSERT pra anon/authenticated; leitura só via service role na API route ou por master). Vale um item de backlog futuro pra revisar as 3 tabelas antigas.

## O que foi feito
1. **Migration `20260922000000_add_landing_chat_leads.sql`**: tabelas `landing_leads` (session_id, email, whatsapp, utms, convertido) e `landing_chat_mensagens` (role, conteudo). RLS: só INSERT pra anon/authenticated; SELECT/UPDATE/DELETE só pra master (`check_is_master()`).
2. **`src/lib/services/landingChatService.ts`**: `getOrCreateLead`, `getHistory`, `saveMessage`, `captureContact`, `processMessage` (orquestra tudo). Usa `getSupabaseServerClient()` (service role) pra ler/escrever — nunca o client anon. OpenAI `gpt-4o-mini`, mesmo modelo do suporte pós-login, com fallback local (`runSimulation`) quando `OPENAI_API_KEY` não está configurada.
3. **Tool calling `capturar_contato`**: a IA só chama quando o visitante fornece e-mail/WhatsApp espontaneamente ou após ela perguntar se pode mandar mais informações — nunca bloqueia a conversa pedindo contato antes de responder.
4. **System prompt**: proíbe citar valores em R$ (não há preço comunicado na LP — o valor do Stripe em `checkout/route.ts` é rotulado como teste); sempre oferece `/criar` como próximo passo; conhecimento restrito às features reais da LP.
5. **`src/app/api/landing-chat/route.ts`**: `POST` (enviar mensagem) e `GET` (restaurar histórico por `sessionId`, pra sobreviver a reload da página).
6. **`src/components/landing/LandingChatWidget.tsx`**: widget flutuante na Landing Page, `session_id` gerado via `crypto.randomUUID()` e persistido em `localStorage`, captura UTMs da URL na primeira mensagem.

## Critérios de Aceitação (QA)
- [x] Visitante anônimo consegue conversar sem cadastro/login.
- [x] Histórico sobrevive a reload da página (mesma sessão).
- [x] IA nunca menciona valores em reais.
- [x] Captura de contato só acontece com o dado fornecido pelo visitante, nunca forçada.
- [x] RLS impede leitura de leads/mensagens por `anon`/`authenticated` — só master ou service role.
- [x] Fallback funcional sem `OPENAI_API_KEY` configurada (dev).

## Status: ✅ DONE (copy do system prompt pendente de revisão pelo dono do produto antes de produção)

## File List
- `supabase/migrations/20260922000000_add_landing_chat_leads.sql` (novo)
- `src/lib/services/landingChatService.ts` (novo) + `__tests__/landingChatService.test.ts`
- `src/app/api/landing-chat/route.ts` (novo) + `__tests__/route.test.ts`
- `src/components/landing/LandingChatWidget.tsx` (novo) + `.module.css` + `__tests__/LandingChatWidget.test.tsx`
- `src/app/(public)/page.tsx` (modificado — monta o widget)

## Pendências para produção
- Revisar o texto do system prompt (`landingChatService.ts`) com o dono do produto antes de publicar.
- Confirmar `OPENAI_API_KEY` configurada no ambiente de produção (Vercel).
- Considerar rate limiting por `session_id`/minuto se o custo de tokens virar problema real (não implementado nesta entrega).
