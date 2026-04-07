# STORY-023: Customização de Paleta de Cores e Tipografia

## Descrição
Como organizador, desejo alterar as cores principais e as fontes do site para que o visual combine com a paleta escolhida para o casamento real.

## Critérios de Aceitação
1. **Campos no Admin:** Adicionar seletores de cor (color input) e fontes (dropdown) na tela de configurações para:
   - Cor de Fundo (Primary Background).
   - Cor de Texto Principal.
   - Cor de Destaque (Accent Color).
   - Fonte Cursiva (Nomes).
   - Fonte de Títulos.
2. **Integração Supabase:** Criar colunas correspondentes na tabela `configuracoes`.
3. **Injeção de CSS:** O `layout.tsx` ou um provedor global deve injetar essas variáveis CSS (Custom Properties) no `:root`.
4. **Persistência:** As alterações devem ser aplicadas instantaneamente após o salvamento.

## Notas Técnicas
- Usar variáveis como `--bg-primary`, `--text-main`, `--accent` no `globals.css`.
- Garantir que as fontes selecionadas estejam disponíveis (ex: via Google Fonts).

## Status: DONE 🏆
