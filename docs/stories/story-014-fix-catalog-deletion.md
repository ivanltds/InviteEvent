# Story-014: Correção Definitiva da Exclusão no Catálogo Global

## 1. Contexto & Problema
Usuários administrativos (MASTER) relatavam que, ao tentar excluir um item do Catálogo Global (`presentes_base`), o sistema exibia mensagem de sucesso, mas o item permanecia visível (item "fantasma"). O problema era causado por falhas de autorização RLS e falta de propagação do JWT nas chamadas de API do servidor.

## 2. Soluções Implementadas

### 2.1. Refatoração do Client Supabase (Server-Side)
- **Arquivo:** `src/lib/supabase-server.ts`
- **Mudança:** O helper `getSupabaseServerClient` agora aceita um parâmetro opcional `req` e prioriza a recuperação do token JWT do header `Authorization`. Isso garante que requisições feitas via `fetch` do frontend para as API Routes do Next.js carreguem a identidade do usuário.
- **Segurança:** Mantida a lógica de `Service Role` apenas se explicitamente configurada e necessária, respeitando o RLS por padrão.

### 2.2. Injeção de JWT no Cockpit Administrativo
- **Arquivo:** `src/app/(admin)/admin/catalogo/page.tsx`
- **Mudança:** Todas as operações de mutação (`handleDelete`, `handleBulkCurate`, `handleApprove`) foram atualizadas para recuperar a sessão ativa e incluir o cabeçalho `Authorization: Bearer <JWT>` em todas as chamadas `fetch`.

### 2.3. Lógica de Deleção no Banco
- **Arquivo:** `src/app/api/admin/catalogo/route.ts`
- **Lógica:** Implementada verificação de integridade financeira. Itens sem transações são deletados fisicamente; itens com histórico são marcados como excluídos (soft-delete) para preservar a contabilidade.

## 3. Qualidade & Validação

### 3.1. Checklist de Conclusão
- [x] RLS validado para usuário MASTER (ivanltds@gmail.com).
- [x] Cabeçalhos de autorização adicionados ao frontend.
- [x] Helper do servidor suportando múltiplos mecanismos de auth.
- [x] `npm run lint` executado (erros remanescentes são pré-existentes).
- [x] `npm run typecheck` adicionado e validado.
- [x] Checklist de story atualizado.

### 3.2. Testes Realizados
- Deleção individual de item limpo (sucesso).
- Deleção em massa (sucesso).
- Tentativa de deleção sem token (bloqueado - 401/403).

## 4. Arquivos Modificados
- `src/lib/supabase-server.ts`
- `src/app/(admin)/admin/catalogo/page.tsx`
- `src/app/api/admin/catalogo/route.ts`
- `package.json` (adição de typecheck)

---
*Validado pelo @maestro em 16/05/2026*
