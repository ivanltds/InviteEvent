# STORY-021: Edição da Narrativa (História e Noivos) via Admin

## Descrição
Como organizador, desejo editar os textos das seções "Nossa História" e "Os Noivos" pelo painel administrativo para que eu possa personalizar a narrativa sem precisar alterar o código.

## Critérios de Aceitação
1. **Campos no Admin:** Adicionar áreas de texto (textarea) na tela de configurações para:
   - História: Título, Subtítulo e Corpo do texto.
   - Os Noivos: Descrição da Noiva e Descrição do Noivo.
2. **Integração Supabase:** Criar colunas correspondentes na tabela `configuracoes`.
3. **Consumo no Front-end:** Os componentes `Historia.tsx` e `OsNoivos.tsx` devem buscar esses dados do Supabase (com fallback para os textos atuais se estiverem vazios).
4. **Suporte a Quebra de Linha:** O front-end deve renderizar as quebras de linha enviadas pelo Admin.

## Notas Técnicas
- Usar `white-space: pre-wrap` ou processar parágrafos para manter a formatação do organizador.
- Garantir que o estado de loading não quebre o layout das seções.

## Status: DONE 🏆
