# STORY-028: Gestão de Múltiplos Eventos (Agenda)

## Descrição
Como organizador, desejo cadastrar outros eventos relacionados (Chá de Panela, Jantar de Ensaio, etc.) para que os convidados tenham todas as informações de agenda em um único lugar.

## Critérios de Aceitação
1. **Nova Tabela:** Criar tabela `eventos_agenda` no Supabase com campos `nome`, `data`, `horario`, `local`, `endereco` e `descricao`.
2. **Interface Admin:** Criar seção "Agenda do Casamento" no painel administrativo para gerenciar esses eventos.
3. **Listagem Pública:** Adicionar uma nova seção "Programação" na Home pública que liste esses eventos cronologicamente.
4. **Mapa:** Cada evento na agenda deve ter seu próprio link para o Google Maps.

## Notas Técnicas
- Garantir que a exclusão de um evento na agenda não afete os dados principais do casamento.
- Estilizar a seção de agenda para manter a consistência visual com os demais blocos da Home.

## Status: ⚪ Draft
