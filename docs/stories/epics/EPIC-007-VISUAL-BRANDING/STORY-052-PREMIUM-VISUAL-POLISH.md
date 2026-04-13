# STORY-052: Refinamento Visual Premium do Convite Público

## Descrição
Como convidado ao casamento de Layslla e Marcus, desejo que o convite digital transmita sofisticação, romantismo e personalidade jovem, para que a experiência de receber e abrir o convite seja emocionante e memorável.

## Contexto
O convite público em `/inv/[slug]` está funcional (Hero, História, Noivos, Detalhes, RSVP, FAQ, Countdown), mas o visual precisa de refinamento para atingir o padrão "premium" descrito na proposta original.

## Critérios de Aceitação
1. **Tipografia Cursiva:** Nomes do casal renderizados com fonte cursiva fina, exagerada (Pinyon Script ou similar) com tamanho fluid `clamp()`.
2. **Paleta Refinada:** Background marfim/champagne (`#fdfbf7`), texto cinza quente (`#4a4a4a`), acentos verde-sálvia (`#8fa89b`), dourado sutil em detalhes.
3. **Monograma:** Renderizar monograma "L & M" com fonte cursiva como elemento decorativo.
4. **Divisores Delicados:** Separadores entre seções com ornamentos finos (linhas SVG com curvas).
5. **Micro-animações:** Fade-in suave das seções ao scroll (Intersection Observer), hover elegante nos botões.
6. **Hero Premium:** Foto do casal com overlay suave, contagem regressiva elegante, CTA de RSVP proeminente.
7. **Mobile-First:** Todos os elementos otimizados para toque mobile com touch targets ≥ 44px.
8. **Textura:** Background com textura sutil de papel/grão usando CSS `noise` ou imagem leve.

## O Que Evitar (por proposta)
- ❌ Gradientes chamativos
- ❌ Excesso de animações
- ❌ Autoplay de música
- ❌ Visual genérico de template
- ❌ Poluição visual

## Prioridade: 🟡 Alta (Experiência do convidado é o produto final)
## Esforço: L (4-6h)
## Status: 📋 TODO

## Referências
- Seção "Requisitos visuais" da proposta original (`proposta`)
- Design tokens já configuráveis via `/admin/configuracoes` (bg_primary, text_main, accent_color, font_cursive, font_serif)
