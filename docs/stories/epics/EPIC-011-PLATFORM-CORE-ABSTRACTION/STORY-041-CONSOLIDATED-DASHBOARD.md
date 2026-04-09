# STORY-041: Dashboard Consolidado de Eventos

## Descrição
Como organizador, desejo uma tela centralizada que liste todos os casamentos que eu gerencio, exibindo métricas rápidas de cada um, para facilitar a navegação multi-evento.

## Critérios de Aceitação
1. **Listagem de Eventos:** Buscar todos os eventos onde o usuário logado é `owner` ou `organizador`.
2. **Métricas Rápidas:** Exibir em cada card:
   - Total de convites enviados vs. confirmados.
   - Contagem regressiva para a data do evento.
3. **Navegação de Contexto:** Ao clicar em um evento, o `EventContext` deve ser atualizado e o usuário levado para o dashboard específico do evento.
4. **Estado Vazio:** Se o usuário não tiver eventos, exibir um CTA proeminente para "Criar meu Primeiro Casamento".

## Status: 🚀 Ready

## Detalhes de UX (Uma)
- **Visual:** Cards com bordas suaves, tipografia serifada nos títulos.
- **Feedback:** Shimmer effect enquanto carrega a lista.
