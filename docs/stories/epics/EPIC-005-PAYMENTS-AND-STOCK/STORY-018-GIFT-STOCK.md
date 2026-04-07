# STORY-018: Gestão de Estoque de Presentes

## Descrição
Implementação de controle de quantidade para itens da lista de presentes, permitindo que um mesmo item seja presenteado por múltiplas pessoas até atingir o limite definido.

## Critérios de Aceitação
1. **Novas Colunas:** Adicionar `quantidade_total` e `quantidade_reservada` na tabela `presentes`.
2. **Gestão Admin:** Permitir definir a quantidade total ao cadastrar/editar um presente no painel admin.
3. **Indicador de Disponibilidade:** Exibir "X de Y disponíveis" na vitrine pública para itens com quantidade > 1.
4. **Esgotamento:** Desabilitar o botão "Presentear" e exibir "Item Esgotado" quando a reserva atingir o total.

## Estratégia Técnica
- Atualização do schema SQL.
- Lógica de cálculo no frontend (`item.quantidade_total - item.quantidade_reservada`).

## Status: DONE 🏆
