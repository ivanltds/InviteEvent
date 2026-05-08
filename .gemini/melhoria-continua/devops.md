# Melhoria Contínua
> Arquivo incremental. Nunca apagar entradas.
> Lido automaticamente pelo MAESTRO antes de acionar o agente correspondente.

## Formato de Registro
## [YYYY-MM-DD] — Tipo: [BUG | PROCESSO | COMUNICAÇÃO | QUALIDADE | UX | NEGÓCIO | ARQUITETURA | OUTRO]
**Contexto:** [fase / PRD]
**Problema:** [descrição objetiva]
**Impacto:** [efeito causado]
**Ação corretiva:** [o que deve mudar]
**Status:** [ABERTO | APLICADO]

## Histórico

## [2024-05-24] — Tipo: PROCESSO
**Contexto:** Automação de Banco de Dados / DevOps
**Problema:** Erros "Tenant not found" e falta de binários (pg_dump) impedindo automação via agente.
**Impacto:** Necessidade de intervenção manual no painel do Supabase, quebrando o fluxo de entrega segura.
**Ação corretiva:** Padronização do uso da Porta 5432 (Session Mode) para DDL e exigência do Supabase CLI com Access Token.
**Status:** APLICADO
