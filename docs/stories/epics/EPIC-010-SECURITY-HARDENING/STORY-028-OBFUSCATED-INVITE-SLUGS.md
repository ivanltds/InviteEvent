# STORY-028: Ofuscação de Slugs de Convite

## Descrição
Substituir slugs baseados apenas em nomes (previsíveis) por identificadores ofuscados para evitar que convidados acessem ou modifiquem RSVPs de terceiros.

## Critérios de Aceitação
1. **Identificadores Únicos:** Gerar slugs que incluam um sufixo aleatório (ex: `familia-silva-a8f2`).
2. **Migração de Dados:** Criar script ou função para atualizar os slugs existentes no banco.
3. **Persistência de Links:** Garantir que o gerador de links no Admin reflita a nova estrutura ofuscada.

## Status: DONE 🏆
