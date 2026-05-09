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

## [2026-05-09] — Tipo: UX
**Contexto:** Criação de Telas e Prototipagem
**Problema:** Desenhar visões abstratas sem considerar as telas e lógicas que já estão prontas no sistema.
**Impacto:** Redundâncias desnecessárias, inconsistências na identidade visual e retrabalho de refatoração para o Dev.
**Ação corretiva:** O UX deve sempre considerar o que já está implementado e operacional na aplicação antes de projetar novas interfaces, criando soluções integradas de forma harmônica e evitando elementos duplicados.
**Status:** APLICADO