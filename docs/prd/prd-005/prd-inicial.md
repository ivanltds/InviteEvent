# PRD-005 — Governança de Dados, Soft Delete e Blindagem Financeira 🛡️
> Versão: 1.0 | Data: 2026-05-10 | Status: CONCLUÍDO (Póstumo)

## 1. Visão Geral do Produto
Este ciclo focou na introdução de barreiras de segurança agressivas (Data Shielding) para evitar destruição acidental de eventos críticos, instituição da Lixeira corporativa (Soft Delete) com retenção de 30 dias e reforço das transações financeiras (Stripe BRL Vectoring) para maximizar a aprovação bancária regional.

## 2. Alterações Implementadas (Executadas)

### 2.1. Arquitetura de Soft Delete (Lixeira)
- **Problema**: Casamentos excluídos sumiam definitivamente do Postgres, impossibilitando arrependimento ou recuperação emergencial.
- **Solução**: 
  - Adicionado a coluna `deleted_at` à tabela `public.eventos`.
  - Refatorado o `eventService.ts`: Operação `delete` substituída por `UPDATE deleted_at = NOW()`.
  - Métodos `getMyEvents` agora contêm a cláusula `.is('deleted_at', null)` para filtrar itens ativos de forma transparente.
- **Impacto**: Dados retidos em banco com rastreabilidade completa sem afetar a visualização nativa.

### 2.2. RBAC Gate: Proteção contra Exclusão de Eventos Ativos
- **Problema**: O sistema permitia que qualquer Proprietário (Owner) destruísse eventos que já haviam efetuado pagamento e estavam "vivos".
- **Solução**:
  - Inserido um `gate guard` no Dashboard: Se `event.is_active === true`, o clique no ícone de lixeira verifica `isMaster`.
  - Usuários comuns recebem o block toast: `"Somente o Master pode excluir um casamento ativo."`

### 2.3. Visibilidade Restrita da Lixeira (View-Level Security)
- **Problema**: Usuários comuns visualizavam a fila de lixeira, poluindo o painel.
- **Solução**:
  - O endpoint `getDeletedEvents` foi lacrado para retornar `[]` para qualquer usuário sem o privilégio `is_master`.
  - Componente UI no Dashboard encapsulado em condicional `{isMaster && ...}`.
  - Adicionado `setCurrentEvent(null)` no hook de restauração para manter o estado fixado no painel central pós-recuperação.

### 2.4. Reforço de Segurança em Transações (Stripe Payload Enhancing)
- **Problema**: Transações no Stripe falhavam por inconsistências de validação do banco emissor (Erro 400 no token do cartão).
- **Solução**:
  - Injeção de `customer_email` automático extraído da sessão do Supabase.
  - Habilitação de `billing_address_collection: 'required'`, forçando o input de CEP/Endereço para satisfazer protocolos 3D-Secure exigidos por emissores de BRL.

---

## 3. Plano de Testes (QA Execution Strategy)

Abaixo está a matriz de cobertura requerida para esta fase de governança.

### 🧪 Matriz de Testes Unitários (Jest)
1. `eventService.deleteEvent` -> Deve disparar um UPDATE no `deleted_at` e NÃO um DELETE físico.
2. `eventService.getDeletedEvents` (Master) -> Deve listar registros onde `deleted_at IS NOT NULL`.
3. `eventService.getDeletedEvents` (Common) -> Deve retornar array vazio forçadamente.
4. `eventService.restoreEvent` -> Deve restaurar o registro limpando o campo `deleted_at`.

### 🧪 Matriz E2E (Playwright Recomendada)
- `TEST-005-01`: **Validar Block de Deletar Ativo**:
  - *Passos*: Logar como Organizador -> Clicar em Deletar Casamento Ativo.
  - *Esperado*: Abertura do Toast Negativo, Modal de exclusão NÃO abre.
- `TEST-005-02`: **Restaurar Casamento sem Pular Tela**:
  - *Passos*: Logar como Master -> Expandir Lixeira -> Clicar Restaurar.
  - *Esperado*: O card deve migrar da lixeira para o grid principal e o usuário deve PERMANECER no grid, sem entrar no evento automaticamente.

---
*Nota de Homologação: Documento validado pelo Maestro AI e arquivado.*
