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

## [2026-05-09] ‚Äî Tipo: UX
**Contexto:** Cria√ß√£o de Telas e Prototipagem
**Problema:** Desenhar vis√µes abstratas sem considerar as telas e l√≥gicas que j√° est√£o prontas no sistema.
**Impacto:** Redund√¢ncias desnecess√°rias, inconsist√™ncias na identidade visual e retrabalho de refatora√ß√£o para o Dev.
**A√ß√£o corretiva:** O UX deve sempre considerar o que j√° est√° implementado e operacional na aplica√ß√£o antes de projetar novas interfaces, criando solu√ß√µes integradas de forma harm√¥nica e evitando elementos duplicados.
**Status:** APLICADO
## [2026-05-11] ó Tipo: PROCESSO / DIRETRIZ DE DESIGN
**Contexto:** Feedback do Operador sobre GeraÁ„o de Wireframes
**Problema:** Necessidade de garantir fidelidade absoluta ao legado e minimizar quebra de padrıes.
**Impacto:** OtimizaÁ„o de implementaÁ„o e reduÁ„o de refactor de UI.
**AÁ„o corretiva:** A partir de agora, TODO wireframe gerado deve se basear ESTRITAMENTE nos componentes j· codificados e no Design System real do projeto, evitando inventar novos estilos e minimizando impacto colateral no cÛdigo produtivo.
**Status:** APLICADO (REGRA MESTRA)

## [2026-05-11] ó Tipo: EST…TICA / DIRETRIZ DE DESIGN
**Contexto:** ProibiÁ„o do uso de Emojis nativos.
**Problema:** Emojis descaracterizam o tom premium e o Design System formal da plataforma.
**Impacto:** PrejuÌzo ‡ imagem visual da marca.
**AÁ„o corretiva:** PROIBIDO o uso de emojis (ex: ??, ??) em interfaces, designs ou wireframes. Utilize sempre Ìcones de fontes apropriadas (SVG, Lucide, FontAwesome ou GLYPHS) que sigam o estilo minimalista dourado/preto existente.
**Status:** APLICADO (REGRA MESTRA)
