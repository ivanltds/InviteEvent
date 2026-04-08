# STORY-038: Edição de Quantidade e Detalhes de Presentes (Admin)

## Descrição
Como organizador, desejo poder editar a quantidade total e outros detalhes (nome, preço, descrição) de um presente já cadastrado, para corrigir erros de digitação ou ajustar a estratégia da lista de presentes sem precisar excluir e recriar o item.

## Critérios de Aceitação
1. **Interface de Edição:** Adicionar um botão "Editar" para cada item na tabela de presentes do admin.
2. **Modal de Edição:** Ao clicar em editar, deve abrir um modal preenchido com os dados atuais do presente.
3. **Ajuste de Estoque:** Permitir alterar o campo `quantidade_total`.
4. **Persistência:** As alterações devem ser salvas no Supabase e refletidas instantaneamente na tabela do admin e na lista pública.
5. **Validação de Preço:** Garantir que o preço continue sendo tratado como número decimal.

## Status: ✅ DONE

## Notas de Implementação
- Refatorado o modal de "Adicionar" para ser reutilizável como "Editar".
- Implementada a função `handleEdit` no componente `AdminPresentes`.
- Sincronização automática do estado local após o update bem-sucedido.
