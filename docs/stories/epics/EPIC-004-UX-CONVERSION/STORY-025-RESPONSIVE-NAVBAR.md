# STORY-025: Navegação Responsiva com Menu Hambúrguer

## Descrição
Como convidado acessando pelo celular, desejo um menu de navegação simplificado (hambúrguer) para que a interface não fique poluída e eu consiga navegar facilmente pelas seções do site.

## Critérios de Aceitação
1. **Botão Hambúrguer:** Em telas menores que 768px, os links da Navbar devem ser substituídos por um ícone de menu (hambúrguer).
2. **Menu Mobile:** Ao clicar no ícone, deve abrir um menu lateral (drawer) ou overlay com os links: Nossa História, O Evento, RSVP e Presentes.
3. **Interação Suave:** A abertura e fechamento do menu devem ter uma animação suave (transition).
4. **Fechamento Automático:** O menu deve fechar automaticamente ao clicar em um link ou fora da área do menu.
5. **Acessibilidade:** O botão deve ter um `aria-label` e ser navegável via teclado.

## Notas Técnicas
- Usar estado (`useState`) no componente `Navbar.tsx`.
- Implementar o ícone via CSS puro ou SVG simples para evitar dependências extras.
- Garantir que o `z-index` do menu mobile seja superior ao conteúdo da página.

## Status: DONE 🏆
