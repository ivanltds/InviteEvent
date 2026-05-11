# Melhoria Cont√≠nua
> Arquivo incremental. Nunca apagar entradas.
> Lido automaticamente pelo MAESTRO antes de acionar o agente correspondente.

## Formato de Registro
## [YYYY-MM-DD] ‚Äî Tipo: [BUG | PROCESSO | COMUNICA√á√ÉO | QUALIDADE | UX | NEG√ìCIO | ARQUITETURA | OUTRO]
**Contexto:** [fase / PRD]
**Problema:** [descri√ß√£o objetiva]
**Impacto:** [efeito causado]
**A√ß√£o corretiva:** [o que deve mudar]
**Status:** [ABERTO | APLICADO]

## Hist√≥rico

## [2026-05-09] ‚Äî Tipo: PROCESSO
**Contexto:** Desenvolvimento de Features (TDD)
**Problema:** Desenvolver funcionalidades sem ter as su√≠tes de testes prontas em RED causa instabilidade e retrabalho de QA.
**Impacto:** Quebras de regress√£o f√°ceis de passar despercebidas na interface.
**A√ß√£o corretiva:** Para cada fase de PRD iniciada, o desenvolvedor deve obrigatoriamente criar os testes unit√°rios e os testes E2E do Playwright primeiro (fase RED), para depois implementar o c√≥digo e buscar o GREEN.
**Status:** APLICADO
## [2026-05-11] ó Tipo: PROCESSO / QUALIDADE DE SOFTWARE
**Contexto:** Feedback do Operador sobre Metodologia de Testes (TDD Strict)
**Problema:** Necessidade de prevenir regressıes em todas as escalas de desenvolvimento.
**Impacto:** Maior estabilidade do cÛdigo e prevenÁ„o de bugs triviais.
**AÁ„o corretiva:** OBRIGAT”RIO adotar metodologia TDD ou Test-First. TODO desenvolvimento novo deve ser precedido da criaÁ„o de testes E2E e/ou Unit·rios. AT… MUDAN«AS PEQUENAS ou pequenos refactors DEVEM incluir cobertura de testes unit·rios antes da escrita do cÛdigo de produÁ„o.
**Status:** APLICADO (REGRA MESTRA)

## [2026-05-11] - Tipo: PROCESSO (ALERTA CRITICO)
**Contexto:** Drift de Schema no Supabase Local-First
**Problema:** Altera√ß√µes feitas no banco direto via Dashboard/API n√£o foram convertidas em migrations SQL, paralisando a cria√ß√£o do ambiente local.
**Impacto:** Bloqueio total de novos desenvolvedores ou containers na infra isolada.
**A√ß√£o corretiva:** NUNCA alterar o banco via dashboard sem criar IMEDIATAMENTE o arquivo .sql correspondente em /supabase/migrations.
**Status:** APLICADO
