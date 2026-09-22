# Checklist: Site URL e Redirect URLs do Supabase Auth (produção)

**Contexto:** o fluxo de recuperação de senha (`/admin/recuperar-senha` → e-mail → `/admin/redefinir-senha`) depende do Supabase Auth aceitar o `redirectTo` que a aplicação envia em `supabase.auth.resetPasswordForEmail()`. Se o domínio de produção não estiver na allow-list do projeto Supabase, o Supabase **rejeita o redirect silenciosamente** e cai no `Site URL` padrão configurado — o usuário recebe o e-mail, mas o link não leva pra tela certa.

Isso é configuração do **Supabase Dashboard** (fora do repositório) e precisa ser aplicado manualmente uma vez por ambiente. `supabase/config.toml` só vale para `supabase start` local (hoje aponta pra `http://127.0.0.1:3000`) — não é sincronizado automaticamente com o projeto hospedado.

## O que configurar

No [Supabase Dashboard](https://supabase.com) → projeto de produção → **Authentication → URL Configuration**:

1. **Site URL**: o domínio canônico de produção (o mesmo valor de `NEXT_PUBLIC_SITE_URL` na Vercel — ver `src/app/api/checkout/route.ts` e `src/lib/services/authService.ts` para onde essa env var é consumida). Exemplo: `https://inviteevent.com.br` (ajustar pro domínio real).
2. **Redirect URLs**: adicionar explicitamente:
   - `https://<dominio-producao>/admin/redefinir-senha`
   - Se a Vercel gerar preview deployments que também precisam testar o fluxo, adicionar o padrão de wildcard da Vercel (`https://*-<nome-do-projeto>.vercel.app/admin/redefinir-senha`) — **confirmar que o plano do Supabase em uso suporta wildcard em Redirect URLs** (nem todo plano aceita `*`; se não aceitar, testar reset de senha só em produção/staging fixos, não em previews).

## Variável de ambiente correspondente (Vercel)

Confirmar que `NEXT_PUBLIC_SITE_URL` está setada no projeto da Vercel (Production **e** Preview, se aplicável) com o domínio de produção — sem essa env var, `authService.requestPasswordReset` cai no fallback `window.location.origin`, que funciona mas gera uma superfície maior de origins possíveis na allow-list do Supabase.

## Rate limiting nativo do Supabase Auth

Além do cooldown client-side de 60s implementado em `/admin/recuperar-senha` (só evita double-submit/spam de clique), a defesa real contra abuso do endpoint de "esqueci minha senha" é o rate limit nativo do Supabase Auth. Confirmar em **Authentication → Rate Limits** (ou equivalente na versão atual do dashboard) que o limite de e-mails de recuperação por hora está ativo em produção — o `supabase/config.toml` local define `email_sent = 2` por hora, mas isso **não é aplicado automaticamente** ao projeto hospedado; é preciso conferir/ajustar direto no dashboard do plano de produção.

## Status

- [ ] Site URL configurado com o domínio de produção
- [ ] Redirect URL de `/admin/redefinir-senha` adicionada
- [ ] `NEXT_PUBLIC_SITE_URL` confirmada na Vercel (Production)
- [ ] Rate limit de e-mail de recuperação confirmado/ajustado no dashboard de produção
- [ ] Teste ponta a ponta: pedir reset com um e-mail real em produção e confirmar que o link do e-mail abre `/admin/redefinir-senha` corretamente
