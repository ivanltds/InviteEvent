# STORY-007-ADMIN-EVENT-CONFIG: Cérebro do Evento

## Descrição
Como organizador, desejo alterar os dados básicos do casamento (nomes, data, local) através de um painel, para que o site reflita as informações atuais sem mudanças no código.

## Critérios de Aceitação
1. **Tela de Configurações:** Campos para Nome da Noiva, Nome do Noivo, Data do Casamento, Endereços da Cerimônia e Recepção.
2. **Persistência Real:** Os dados devem ser salvos na tabela `configuracoes` (singleton).
3. **Consumo Dinâmico:** A Home, Detalhes e RSVP devem ler esses dados do Supabase.

## Detalhes Técnicos
- Tabela `configuracoes` com ID fixo ou estrutura de chave-valor.
- Cache inteligente no Next.js para não onerar o banco a cada acesso.

## Status: DONE 🏆
