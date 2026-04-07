# STORY-022: CRUD de FAQ no Painel Administrativo

## Descrição
Como organizador, desejo adicionar, editar e remover perguntas e respostas no FAQ para que eu possa esclarecer dúvidas dos convidados de forma dinâmica.

## Critérios de Aceitação
1. **Nova Tabela:** Criar tabela `faq` no Supabase com campos `pergunta`, `resposta` e `ordem`.
2. **Interface Admin:** Criar tela ou seção na gestão para gerenciar a lista de FAQ.
3. **CRUD Completo:** Permitir criar nova pergunta, editar existentes e excluir perguntas obsoletas.
4. **Ordenação:** Permitir definir a ordem de exibição das perguntas.
5. **Home Pública:** O componente `FAQ.tsx` deve listar dinamicamente as perguntas vindas do banco.

## Notas Técnicas
- Adicionar RLS na nova tabela (Select público, Insert/Update/Delete apenas autenticado).
- Implementar feedback visual de "Salvo" ao alterar a ordem.

## Status: DONE 🏆
