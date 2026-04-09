# STORY-042: Fluxo de Criação de Novo Casamento

## Descrição
Como um novo usuário que deseja organizar seu casamento, quero criar meu primeiro evento através de um formulário simplificado, para começar minha jornada de personalização.

## Critérios de Aceitação
1. **Formulário de Entrada:** Nome do evento (Ex: Casamento de Ana e Bruno) e Slug desejado (`ana-e-bruno`).
2. **Validação de Slug:** Verificar disponibilidade no banco em tempo real (antes de salvar).
3. **Criação Atômica:** Em uma única operação:
   - Criar entrada na tabela `eventos`.
   - Criar entrada na tabela `evento_organizadores` com `role = 'owner'`.
   - Criar registro base na tabela `configuracoes` com dados genéricos para preenchimento posterior.
4. **Onboarding:** Redirecionar para o dashboard do novo evento com uma mensagem de "Bem-vindo ao seu novo site!".

## Status: 🚀 Ready

## Detalhes de UX (Uma)
- **Escrita:** "Escolha um nome marcante. Sua URL será única."
- **Animação:** Transição suave de fade entre o formulário e o dashboard.
