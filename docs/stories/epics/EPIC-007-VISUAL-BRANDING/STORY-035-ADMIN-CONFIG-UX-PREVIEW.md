# STORY-035: Refinamento de UX & Preview Visual no Admin

## Descrição
Como organizador, desejo que a página de configurações administrativas tenha uma interface mais intuitiva e profissional, com exemplos visuais em tempo real das fontes e cores escolhidas, para que eu possa personalizar o site com segurança sem precisar alternar constantemente entre o admin e a home.

## Critérios de Aceitação
1. **Padronização de UI:** Reorganizar os campos de configuração seguindo padrões modernos de design (agrupamento lógico, espaçamentos consistentes).
2. **Preview de Cores:** Mostrar uma amostra visual (card ou elemento de exemplo) que mude de cor conforme os seletores de "Cor de Fundo", "Cor do Texto" e "Cor de Destaque" são alterados.
3. **Preview de Fontes (Catálogo de 15+ Opções):** 
   - Disponibilizar pelo menos **15 opções de fontes de título**, com foco em estilos **Cursivos/Script** (mínimo 10) e **Serifados Elegantes** (mínimo 5).
   - Ao selecionar a "Fonte Cursiva", exibir um texto de exemplo (ex: "Layslla & Marcus") aplicado com a fonte selecionada instantaneamente.
   - Ao selecionar a "Fonte Serifada", exibir um título de exemplo aplicado com a fonte selecionada.
4. **Layout Responsivo:** Garantir que os previews visuais se adaptem a telas menores no painel administrativo.
5. **Feedback Imediato:** O preview deve ser reativo (sem necessidade de salvar para visualizar a mudança no preview).

## Status: Ready 🚀

## Notas de UX (Uma)
- Utilizar um "Preview Card" que simule um pedaço da interface pública dentro do Admin.
- Garantir contraste acessível nos previews.
- Substituir inputs genéricos por grupos de inputs com ícones informativos (Lucide-React).
