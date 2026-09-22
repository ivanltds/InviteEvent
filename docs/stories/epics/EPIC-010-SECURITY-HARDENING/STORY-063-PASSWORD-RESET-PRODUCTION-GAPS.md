# STORY-063: Reset de Senha — Fechar Gaps de Produção

## Descrição
O fluxo de recuperação de senha (`/admin/recuperar-senha` → e-mail → `/admin/redefinir-senha`) já estava implementado e testado (388/388 testes, commit `52d606a` de 21/09/2026). Faltavam 2 gaps antes de confiar nele em produção — sem mexer no fluxo em si.

## O que foi feito
1. **`src/lib/services/authService.ts`**: `redirectTo` do e-mail de recuperação agora usa `NEXT_PUBLIC_SITE_URL` quando definida (mesmo padrão já usado em `checkout/route.ts`), com fallback pro `window.location.origin` atual. Reduz a allow-list de redirect URLs do Supabase a uma única URL canônica, em vez de múltiplas variantes de origin (previews da Vercel etc.).
2. **`docs/deploys/checklist-supabase-auth-redirect-urls.md`** (novo): runbook documentando o que precisa ser configurado manualmente no Supabase Dashboard (Site URL, Redirect URLs, confirmação do rate limit nativo de e-mail em produção) — configuração fora do repositório.
3. **`src/app/(admin)/admin/recuperar-senha/page.tsx`**: cooldown client-side de 60s após envio bem-sucedido, persistido em `localStorage` (sobrevive a reload). Não é a defesa real contra abuso (isso é o rate limit nativo do Supabase Auth, item do runbook) — só evita double-submit/spam de clique.

## Critérios de Aceitação (QA)
- [x] `redirectTo` aponta pro domínio canônico quando `NEXT_PUBLIC_SITE_URL` está definida.
- [x] Botão de "Enviar link" fica desabilitado com contagem regressiva por 60s após um envio bem-sucedido, mesmo após reload.
- [x] Runbook de configuração do Supabase Dashboard documentado.

## Status: ✅ DONE (ação manual pendente no Supabase Dashboard de produção — ver runbook)

## File List
- `src/lib/services/authService.ts` (modificado) + teste
- `src/app/(admin)/admin/recuperar-senha/page.tsx` (modificado) + teste
- `docs/deploys/checklist-supabase-auth-redirect-urls.md` (novo)

## Pendências para produção
- Aplicar o checklist do runbook no Supabase Dashboard (Site URL, Redirect URLs, rate limit).
- Confirmar `NEXT_PUBLIC_SITE_URL` setada na Vercel (Production).
