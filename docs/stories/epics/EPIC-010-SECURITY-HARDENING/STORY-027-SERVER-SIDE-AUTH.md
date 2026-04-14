# STORY-027: Autenticação Server-Side para Admin

## Descrição
Migrar a validação de acesso ao painel administrativo do lado do cliente para o lado do servidor, removendo a exposição de senhas no bundle público do Next.js.

## Critérios de Aceitação
1. **Segurança de Segredo:** Remover o prefixo `NEXT_PUBLIC_` da variável de senha do admin.
2. **Controle de Sessão:** Implementar persistência de sessão via Cookies (HTTP-only) ou JWT.
3. **Proxy de Proteção:** Criar um `proxy.ts` (Next.js 16) que bloqueie o acesso a todas as rotas em `/admin/*` se o usuário não estiver autenticado.
4. **Login Seguro:** A validação deve ocorrer em uma Server Action ou Rota de API.

## Status: ✅ DONE (STORY-055) 🏆

## Notas de Implementação
- Lógica implementada em `src/proxy.ts` com validação de `sb-access-token` cookie
- Redirecionamento para `/admin/login` se sem sessão ativa
- Barreira de Ativação (STORY-043) para `/inv/[slug]` com check de `is_active`
- **Nota Next.js 16:** O arquivo `src/proxy.ts` e a função `proxy()` são agora o padrão oficial, substituindo o antigo `middleware.ts`. Ver STORY-055.

