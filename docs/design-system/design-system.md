# Design System — InviteEventAI

## 1. Identidade Visual
O InviteEventAI busca uma estética que equilibre o **clássico dos casamentos** com a **modernidade de uma plataforma SaaS**. O design deve ser limpo, sofisticado e, acima de tudo, funcional em dispositivos móveis.

## 2. Paleta de Cores
- **Primária (Destaque):** `#D4AF37` (Dourado Champagne) - Usada para botões principais, links e ícones de destaque.
- **Secundária:** `#4A5568` (Cinza Azulado) - Usada para textos de corpo e ícones secundários.
- **Background Principal:** `#FAFAFA` (Off-white) - Fundo das páginas para reduzir o cansaço visual.
- **Background Secundário:** `#FFFFFF` (Branco) - Cards, seções e inputs.
- **Sucesso:** `#48BB78` (Verde suave) - Confirmações de RSVP e pagamentos.
- **Erro:** `#F56565` (Vermelho suave) - Alertas e validações.

## 3. Tipografia
- **Títulos (Headings):** `Playfair Display`, Serif. Transmite elegância e tradição.
- **Corpo (Body):** `Inter` ou `Montserrat`, Sans-serif. Garante legibilidade em telas pequenas.

| Escala | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| H1     | 32px    | 700  | Títulos de página |
| H2     | 24px    | 600  | Subtítulos de seção |
| Body   | 16px    | 400  | Texto principal |
| Small  | 14px    | 400  | Legendas e metadados |

## 4. Componentes Base

### Botões
- **Primary:** Background dourado, texto branco, bordas levemente arredondadas (8px), transição suave de hover.
- **Secondary:** Borda dourada, fundo transparente, texto dourado.
- **Ghost:** Sem fundo, texto cinza, sublinhado no hover.

### Inputs
- Bordas finas (`1px solid #E2E8F0`), foco com borda dourada.
- Espaçamento interno (padding) generoso para facilitar o toque no mobile.

### Cards
- Sombra leve (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`).
- Bordas de 12px.
- Fundo branco.

## 5. Ícones
- Utilizar a biblioteca **Lucide React** (ícones de linha fina e minimalista).

## 6. Layout
- **Grid:** Sistema de 12 colunas para Desktop, 4 colunas para Mobile.
- **Espaçamento:** Base 4 (4px, 8px, 16px, 24px, 32px, 64px).
- **Abordagem:** Mobile-First.

---
*Documento criado pelo Designer UX/UI para orientar a implementação.*
