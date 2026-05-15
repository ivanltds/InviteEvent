# Melhoria Contínua
> Arquivo incremental. Nunca apagar entradas.
> Lido automaticamente pelo MAESTRO antes de acionar o agente correspondente.

## Formato de Registro
## [YYYY-MM-DD] – Tipo: [BUG | PROCESSO | COMUNICAÇÃO | QUALIDADE | UX | NEGÓCIO | ARQUITETURA | OUTRO]
**Contexto:** [fase / PRD]
**Problema:** [descrição objetiva]
**Impacto:** [efeito causado]
**Ação corretiva:** [o que deve mudar]
**Status:** [ABERTO | APLICADO]

## Histórico

## [2026-05-09] – Tipo: UX
**Contexto:** Criação de Telas e Prototipagem
**Problema:** Desenhar visões abstratas sem considerar as telas e lógicas que já estão prontas no sistema.
**Impacto:** Redundâncias desnecessárias, inconsistências na identidade visual e retrabalho de refatoração para o Dev.
**Ação corretiva:** O UX deve sempre considerar o que já está implementado e operacional na aplicação antes de projetar novas interfaces, criando soluções integradas de forma harmônica e evitando elementos duplicados.
**Status:** APLICADO

## [2026-05-11] - Tipo: PROCESSO / DIRETRIZ DE DESIGN
**Contexto:** Feedback do Operador sobre Geração de Wireframes
**Problema:** Necessidade de garantir fidelidade absoluta ao legado e minimizar quebra de padrões.
**Impacto:** Otimização de implementação e redução de refactor de UI.
**Ação corretiva:** A partir de agora, TODO wireframe gerado deve se basear ESTRITAMENTE nos componentes já codificados e no Design System real do projeto, evitando inventar novos estilos e minimizando impacto colateral no código produtivo.
**Status:** APLICADO (REGRA MESTRA)

## [2026-05-11] - Tipo: ESTÉTICA / DIRETRIZ DE DESIGN
**Contexto:** Proibição do uso de Emojis nativos.
**Problema:** Emojis descaracterizam o tom premium e o Design System formal da plataforma.
**Impacto:** Prejuízo à imagem visual da marca.
**Ação corretiva:** PROIBIDO o uso de emojis (ex: 🎁, 🎄) em interfaces, designs ou wireframes. Utilize sempre ícones de fontes apropriadas (SVG, Lucide, FontAwesome ou GLYPHS) que sigam o estilo minimalista dourado/preto existente.
**Status:** APLICADO (REGRA MESTRA)

## [2026-05-15] - Tipo: UX / QUALIDADE / PROCESSO
**Contexto:** PRD-014: Wireframe de Cotas de Presentes (`cotas-presentes.html`)
**Problema:** O wireframe gerado ignorou completamente o Design System do projeto (foi feito em Dark Mode genérico em vez de Luxo Contemporâneo/Alabaster Light) e violou as regras mestras de uso de emojis nativos.
**Impacto:** Reprovação imediata do Operador, descaracterização da marca visual e quebra de governança estabelecida.
**Ação corretiva:** UX/UI deve revisar e manter estrita aderência ao Design System oficial (`docs/design-system/design-system.md`) e às diretrizes de melhoria contínua anteriores. O protótipo deve ser refeito IMEDIATAMENTE no tema Light/Alabaster, sem emojis nativos e em conformidade estilística com os demais módulos da vitrine.
**Status:** APLICADO (CORRIGIDO PELO MAESTRO EM FASE DE REVISÃO)
