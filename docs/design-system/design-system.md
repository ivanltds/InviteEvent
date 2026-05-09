# Design System — InviteEventAI: Versão Majestosa (Luxo Contemporâneo)

## 1. Visão de Design (O Mood)
O InviteEventAI evolui para o conceito de **Luxo Contemporâneo**. A estética é minimalista, limpa e "arejada", priorizando o conteúdo (fotos e informações do evento) através de camadas de profundidade, transparências sofisticadas (Glassmorphism) e movimentos coreografados.

- **Atributos:** Elegância, Exclusividade, Fluidez, Calma.
- **Referência:** Design System da Apple (iOS/macOS), sites de alta costura e joalherias de luxo.

## 2. Fundações Visuais

### 2.1. Paleta de Cores (The Royal Palette)
| Cor | Hex | Uso |
|:--- |:--- |:--- |
| **Pure White** | `#FFFFFF` | Fundos de cards e superfícies principais. |
| **Soft Alabaster** | `#F9F9FB` | Fundo principal da aplicação (quase branco). |
| **Royal Gold** | `#C5A059` | Destaques, botões primários e ícones premium. |
| **Midnight Ink** | `#1A1A1A` | Tipografia principal, títulos e elementos de contraste. |
| **Ethereal Glass** | `rgba(255, 255, 255, 0.7)` | Superfícies com Glassmorphism (Backdrop Blur). |
| **Subtle Slate** | `#71717A` | Textos secundários e metadados. |

### 2.2. Tipografia (The Editorial Pair)
A tipografia deve evocar uma revista de moda ou um convite de papel de alta gramatura.

- **Primary (Serif):** `Playfair Display`. Usada para nomes dos noivos, títulos de seções e citações. Transmite tradição e requinte.
- **Secondary (Sans-Serif):** `Inter`. Usada para interface, formulários e textos de leitura. Deve ter *letter-spacing* generoso em botões e labels.

| Estilo | Fonte | Tamanho | Weight | Case | Letter Spacing |
|:--- |:--- |:--- |:--- |:--- |:--- |
| **Hero Title** | Playfair | 48px+ | 700 | Normal | -0.02em |
| **Section Title** | Playfair | 32px | 600 | Normal | 0 |
| **UI Label** | Inter | 12px | 600 | Uppercase | 0.1em |
| **Body Text** | Inter | 16px | 400 | Normal | 0 |

### 2.3. Efeitos e Profundidade
- **Glassmorphism:** `backdrop-filter: blur(12px)`. Aplicado em modais, barras de navegação e sobreposições.
- **Shadows (Airy):** Sombras muito suaves e difusas. `box-shadow: 0 20px 50px rgba(0,0,0,0.05)`.
- **Bordas:** `1px solid rgba(0,0,0,0.05)` para separação sutil sem "pesar" o layout.
- **Border Radius:** `24px` para cards grandes, `12px` para botões e inputs.

## 3. Animações e Micro-interações (Nível 5)
A alma da "Nova UI" está no movimento. Não usamos "transições", usamos "coreografias".

- **Curvas de Beziér:** `cubic-bezier(0.4, 0, 0.2, 1)` (suave e natural).
- **Staggering:** Elementos de uma lista ou grid entram um após o outro com um pequeno delay (0.05s).
- **Parallax Sutil:** Imagens de fundo movem-se 10-15% mais devagar que o scroll.
- **Haptic-like Feedback:** Botões diminuem levemente de escala (scale(0.97)) ao serem pressionados.

## 4. Componentes Premium

### 4.1. Botão "The Signature"
- **Estilo:** Fundo Royal Gold, texto Pure White.
- **Animação:** Ao hover, o brilho aumenta levemente e o botão flutua (translateY(-2px)).
- **Variante Ghost:** Borda Royal Gold de 1px, texto Royal Gold.

### 4.2. Cards "Floating Canvas"
- **Estilo:** Fundo Pure White ou Ethereal Glass.
- **Bordas:** Arredondadas (24px).
- **Conteúdo:** Muita margem (padding: 40px+).

### 4.3. Inputs "Elegant Line"
- **Estilo:** Apenas uma linha inferior ou box com borda ultra-fina. Foco transforma a linha em Royal Gold com um pequeno brilho.

## 5. Mobile-First Luxury
No mobile, a experiência deve ser operável com o polegar.
- Botões grandes (mínimo 48px de altura).
- Navegação via gestos (ex: arrastar para fechar modais).
- Imagens em tela cheia (Edge-to-Edge).

---
*Atualizado por UX/UI para PRD-002.*
