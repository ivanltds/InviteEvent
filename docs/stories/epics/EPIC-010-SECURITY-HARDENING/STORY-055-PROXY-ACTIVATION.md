# STORY-055: Ativação do Proxy Next.js (Ex-Middleware)

## Descrição
Como administrador da plataforma, desejo que a proteção de rotas server-side funcione de fato através do novo `proxy.ts`, para que rotas `/admin/*` não sejam acessíveis sem autenticação e a barreira de ativação (`is_active`) bloqueie convites de eventos inativos.

## Contexto
O Next.js 16 (2026) depreciou o antigo `middleware.ts` em favor do `proxy.ts` e da função `proxy()`. Toda a lógica de proteção já está implementada em `src/proxy.ts`.

## Critérios de Aceitação
1. **Nome do Arquivo:** Deve ser `src/proxy.ts` (conforme convenção Next.js 16).
2. **Exportação da Função:** Deve exportar `async function proxy()`.
3. **Manter `config.matcher`:** Já está correto, deve continuar funcionando.
4. **Corrigir Build:** Garantir que `npm run build` passe sem erros (resolver prerendering de `/admin/configuracoes`).
5. **Testes:** Validar que rotas `/admin/*` redirecionam para login sem sessão, e `/inv/[slug]` de evento inativo vai para `/manutencao`.

## Prioridade: 🔴 CRÍTICA (Segurança)
## Esforço: XS (< 30 min)
## Status: ✅ DONE (Implementado como STORY-055)

## Notas Técnicas
- O erro de build `TypeError: Cannot read properties of null (reading 'useState')` em `/admin/configuracoes` ocorre porque `'use client'` está presente mas o Next.js tenta prerender a página. Solução: adicionar `export const dynamic = 'force-dynamic'` nas páginas admin ou configurar via `next.config.ts`.
- Os testes estão em `src/__tests__/proxy.test.ts`.
