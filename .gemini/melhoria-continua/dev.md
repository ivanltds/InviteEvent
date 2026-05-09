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

## [2026-05-09] — Tipo: PROCESSO
**Contexto:** Desenvolvimento de Features (TDD)
**Problema:** Desenvolver funcionalidades sem ter as suítes de testes prontas em RED causa instabilidade e retrabalho de QA.
**Impacto:** Quebras de regressão fáceis de passar despercebidas na interface.
**Ação corretiva:** Para cada fase de PRD iniciada, o desenvolvedor deve obrigatoriamente criar os testes unitários e os testes E2E do Playwright primeiro (fase RED), para depois implementar o código e buscar o GREEN.
**Status:** APLICADO