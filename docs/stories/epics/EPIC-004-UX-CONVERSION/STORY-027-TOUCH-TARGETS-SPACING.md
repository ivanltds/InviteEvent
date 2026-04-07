# STORY-027: Otimização de Touch Targets e Espaçamento Mobile

## Descrição
Como convidado usando dispositivo móvel, desejo que os botões e links sejam fáceis de clicar e que o conteúdo ocupe bem o espaço da tela, para evitar erros de clique e excesso de rolagem horizontal.

## Critérios de Aceitação
1. **Área de Toque:** Todos os elementos interativos (botões, links, inputs) devem ter uma área mínima de clique de 44x44px.
2. **Padding Flexível:** Em dispositivos mobile (< 480px), reduzir os paddings laterais fixos de `2rem` para `1rem` ou `1.5rem` para maximizar o espaço do conteúdo.
3. **Formulário RSVP:** O campo de busca e o formulário de RSVP devem ocupar 100% da largura disponível no mobile, eliminando margens excessivas.
4. **Sem Rolagem Horizontal:** Garantir que nenhum elemento force a rolagem lateral (horizontal overflow) em resoluções de até 320px.

## Notas Técnicas
- Revisar `RSVP.module.css` e `page.module.css`.
- Usar `box-sizing: border-box` globalmente (já existente) e verificar se há larguras fixas em `px` que precisam ser `100%` ou `vw`.

## Status: DONE 🏆
