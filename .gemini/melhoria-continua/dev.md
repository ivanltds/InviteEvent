# Melhoria ContÃ­nua
> Arquivo incremental. Nunca apagar entradas.
> Lido automaticamente pelo MAESTRO antes de acionar o agente correspondente.

## Formato de Registro
## [YYYY-MM-DD] â€” Tipo: [BUG | PROCESSO | COMUNICAÃ‡ÃƒO | QUALIDADE | UX | NEGÃ“CIO | ARQUITETURA | OUTRO]
**Contexto:** [fase / PRD]
**Problema:** [descriÃ§Ã£o objetiva]
**Impacto:** [efeito causado]
**AÃ§Ã£o corretiva:** [o que deve mudar]
**Status:** [ABERTO | APLICADO]

## HistÃ³rico

## [2026-05-09] â€” Tipo: PROCESSO
**Contexto:** Desenvolvimento de Features (TDD)
**Problema:** Desenvolver funcionalidades sem ter as suÃ­tes de testes prontas em RED causa instabilidade e retrabalho de QA.
**Impacto:** Quebras de regressÃ£o fÃ¡ceis de passar despercebidas na interface.
**AÃ§Ã£o corretiva:** Para cada fase de PRD iniciada, o desenvolvedor deve obrigatoriamente criar os testes unitÃ¡rios e os testes E2E do Playwright primeiro (fase RED), para depois implementar o cÃ³digo e buscar o GREEN.
**Status:** APLICADO
## [2026-05-11] — Tipo: PROCESSO / QUALIDADE DE SOFTWARE
**Contexto:** Feedback do Operador sobre Metodologia de Testes (TDD Strict)
**Problema:** Necessidade de prevenir regressões em todas as escalas de desenvolvimento.
**Impacto:** Maior estabilidade do código e prevenção de bugs triviais.
**Ação corretiva:** OBRIGATÓRIO adotar metodologia TDD ou Test-First. TODO desenvolvimento novo deve ser precedido da criação de testes E2E e/ou Unitários. ATÉ MUDANÇAS PEQUENAS ou pequenos refactors DEVEM incluir cobertura de testes unitários antes da escrita do código de produção.
**Status:** APLICADO (REGRA MESTRA)
