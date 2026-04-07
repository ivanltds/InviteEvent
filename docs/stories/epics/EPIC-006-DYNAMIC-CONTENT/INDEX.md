# EPIC-006: Gestão de Conteúdo Dinâmico (Admin Power-Up II)

## Status: 🟢 DONE

## Descrição
Capacitar o organizador a alterar a narrativa do site (História, Perfil dos Noivos) e gerenciar a base de conhecimento (FAQ) diretamente pelo painel administrativo, eliminando a dependência de alterações no código-fonte.

## Stories
- [x] **STORY-021:** Edição da Narrativa (História e Noivos) via Admin. -> **DONE**
- [x] **STORY-022:** CRUD de FAQ no Painel Administrativo. -> **DONE**

## Notas de Arquitetura
- Migração de textos estáticos para colunas na tabela `configuracoes` ou novas tabelas conforme necessário.
- Uso de Rich Text ou múltiplos campos de texto para manter a formatação.
