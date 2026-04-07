# STORY-026: Tipografia Fluida e Adaptativa

## Descrição
Como convidado, desejo que os textos e títulos do site se ajustem automaticamente ao tamanho da minha tela, para que a leitura seja confortável sem quebras de layout desnecessárias.

## Critérios de Aceitação
1. **Uso de Clamp:** Substituir tamanhos de fonte fixos (ex: `5rem`) por funções `clamp()` no CSS para permitir escala fluida entre dispositivos mobile e desktop.
2. **Títulos Hero:** O título principal (`h1`) deve escalar suavemente sem transbordar em telas estreitas (ex: iPhone SE).
3. **Escala de Seções:** Títulos de seções (`h2`, `h3`) devem seguir uma proporção harmônica em todas as resoluções.
4. **Legibilidade:** Garantir que o contraste do texto sobre o `HeroCarousel` permaneça legível no mobile.

## Notas Técnicas
- Aplicar `clamp(min, preferred, max)` no `globals.css` e CSS Modules.
- Exemplo para h1: `font-size: clamp(2.5rem, 10vw, 5rem);`
- Revisar `line-height` para evitar sobreposição em títulos multilinhas no mobile.
