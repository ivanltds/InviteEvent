# Plano de Implementação Técnica: Blindagem de QA & Stress (PRD-018) 🏗️🛡️

> **Fase:** ARQUITETURA  
> **Responsável:** @architect (Arquiteto de Software)  
> **Data:** 16 de Maio de 2026

---

## 1. Visão Técnica
O objetivo é transformar o **InviteEventAI** em um sistema resiliente a picos de carga (200+ conexões) e falhas de infraestrutura. A arquitetura focará em **Graceful Degradation** (Degradação Suave) e **Concurrency Control** (Controle de Concorrência).

## 2. Pilares de Implementação

### 2.1. Concurrency Control (Banco de Dados)
- **RPC `confirmar_reserva_atomica`:** Revisão da função PostgreSQL para garantir que o uso de `SELECT FOR UPDATE` com `SKIP LOCKED` está otimizado para alta concorrência.
- **Lock Temporário:** Garantir que o lock de 3h não cause fragmentação de índices sob carga massiva.
- **Ação:** Criação de índices parciais para colunas de reserva ativa.

### 2.2. Robustez do Frontend (Resiliência Visual)
- **Global ErrorBoundary:** Criar um componente de alta ordem (HOC) que capture falhas de renderização e exiba o Modal Empático definido no UX.
- **Theme-Aware Logic:** O ErrorBoundary lerá o contexto da página (via prop ou path) para aplicar a classe de CSS adequada (`theme-luxo` ou `theme-admin`).
- **Retry Logic (Exponential Backoff):** Implementar um utilitário de fetch que tenta novamente requisições falhas com intervalos crescentes (ex: 500ms, 1s, 2s) antes de desistir e mostrar o erro definitivo.

### 2.3. Automação de Stress Testing (Playwright)
- **Scenario Script:** Criar `tests/stress/concurrency_reserva.spec.ts`.
- **Parallelization:** Configurar o Playwright para rodar com `workers: 10` ou mais, simulando sessões únicas para 200 reservas simultâneas no mesmo evento.
- **KPI Técnico:** 0% de Deadlocks no banco e 0% de Reservas Duplicadas.

### 2.4. Observabilidade (Local Logging)
- **Middleware de Erro:** Implementar um log-layer que salva erros críticos em uma tabela de auditoria (`logs_sistema`) no Supabase, permitindo que o Master Admin veja o que está falhando em tempo real.

## 3. Tarefas de Desenvolvimento (Sprints)

| Sprint | Atividade | Arquivos Afetados |
| :--- | :--- | :--- |
| **S1** | Infra de Erro & Temas | `src/components/ui/ErrorBoundary.tsx`, `src/lib/fetch-wrapper.ts` |
| **S2** | Otimização de RPC | `supabase/migrations/20260516_stress_optimization.sql` |
| **S3** | Suíte de Stress E2E | `tests/stress/load_test.spec.ts`, `playwright.config.ts` |
| **S4** | Monitoramento Admin | `src/app/api/logs/route.ts`, `src/app/(admin)/admin/logs/page.tsx` |

## 4. Riscos e Mitigações
- **Risco:** O custo de processamento do Supabase (CPU) pode disparar durante o teste de 200 usuários.
- **Mitigação:** Rodar os testes em janelas controladas e monitorar o dashboard do Supabase em tempo real.

---

## 5. Definições do Operador (Refinamento)
1. **Logs de Erro:** Implementar persistência total no Supabase em tabela de auditoria dedicada para visibilidade no painel Admin.
2. **Capacidade de Stress:** Configurar suíte para 10-15 workers paralelos (Hardware: Ryzen 5 5600G / 16GB RAM).
3. **Observabilidade:** Manter solução interna via Supabase; integração com Sentry postergada.

---
*Assinado: @architect (Arquiteto de Software)*
