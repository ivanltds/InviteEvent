# STORY-049: Ativação do Middleware Next.js (Correção Crítica)

## Descrição
Como administrador da plataforma, desejo que a proteção de rotas server-side funcione de fato, para que rotas `/admin/*` não sejam acessíveis sem autenticação e a barreira de ativação (`is_active`) bloqueie convites de eventos inativos.

## Contexto (Bug)
A lógica de proteção está 100% implementada em `src/proxy.ts`, mas o Next.js **exige** que o arquivo se chame `middleware.ts` e a função esteja exportada como `middleware()`. Atualmente, o middleware não executa.

## Critérios de Aceitação
1. **Renomear Arquivo:** `src/proxy.ts` → `src/middleware.ts`
2. **Renomear Função:** `export async function proxy()` → `export async function middleware()`
3. **Manter `config.matcher`:** Já está correto, deve continuar funcionando.
4. **Corrigir Build:** Garantir que `npm run build` passe sem erros (resolver prerendering de `/admin/configuracoes`).
5. **Testes:** Validar que rotas `/admin/*` redirecionam para login sem sessão, e `/inv/[slug]` de evento inativo vai para `/manutencao`.

## Prioridade: 🔴 CRÍTICA (Segurança)
## Esforço: XS (< 30 min)
## Status: 📋 TODO

## Notas Técnicas
- O erro de build `TypeError: Cannot read properties of null (reading 'useState')` em `/admin/configuracoes` ocorre porque `'use client'` está presente mas o Next.js tenta prerender a página. Solução: adicionar `export const dynamic = 'force-dynamic'` nas páginas admin ou configurar via `next.config.ts`.
- Atualizar os testes em `src/__tests__/proxy.test.ts` para refletir o novo nome.
