# STORY-027: Autenticação Server-Side para Admin

## Descrição
Migrar a validação de acesso ao painel administrativo do lado do cliente para o lado do servidor, removendo a exposição de senhas no bundle público do Next.js.

## Critérios de Aceitação
1. **Segurança de Segredo:** Remover o prefixo `NEXT_PUBLIC_` da variável de senha do admin.
2. **Controle de Sessão:** Implementar persistência de sessão via Cookies (HTTP-only) ou JWT.
3. **Middleware de Proteção:** Criar um `middleware.ts` que bloqueie o acesso a todas as rotas em `/admin/*` se o usuário não estiver autenticado.
4. **Login Seguro:** A validação deve ocorrer em uma Server Action ou Rota de API.

## Status: Ready 🚀
