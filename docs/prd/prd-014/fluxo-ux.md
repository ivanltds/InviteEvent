# PRD-014: Fluxo UX/UI de Group Gifting (Cotas)

> **Responsável:** @ux-ui (Designer UX/UI)  
> **Status:** DESENHADO / CONCLUÍDO  
> **Objetivo:** Criar interfaces intuitivas, elegantes e indutoras de conversão para aquisição fracionada de presentes de alto valor.

---

## 🎨 1. Elementos Visuais do Design System

Para manter a coerência com o **Luxo Contemporâneo (Alabaster Light)** e o **Royal Gold**, introduziremos as seguintes convenções para itens fracionáveis:

- **Badge "Group Gift":** Uma pílula sutil com fundo translúcido dourado (`rgba(197, 160, 89, 0.1)`) e borda dourada fina (`1px solid #C5A059`), com o texto `PRESENTE COLETIVO` (Sem emojis, estilo mini-caps/letter-spacing).
- **Barra de Progresso Elegante:** Uma barra linear de 6px de altura.
  - Fundo: `#E5E7EB` (Soft Gray para superfícies claras).
  - Preenchimento: Um gradiente suave dourado (`linear-gradient(90deg, #C5A059 0%, #E5C07B 100%)`).
  - Efeito: Brilho sutil difuso dourado se o progresso estiver acima de 80%.
- **Contador de Múltiplos:** Controles circulares minimalistas com feedback háptico visual (escala em hover).

---

## 🔄 2. Jornada do Convidado (Vitrine & Checkout)

### Passo 1: Identificação na Vitrine Pública
- O convidado navega pela lista de presentes.
- Itens fracionados destacam-se visualmente pela **Barra de Progresso** logo abaixo do título.
- O preço principal é mantido com destaque, mas abaixo dele exibe-se: `Ou em até X cotas de R$ Y`.

### Passo 2: Decisão e Seleção (Checkout Drawer/Modal)
- Ao clicar em "Presentear", um Drawer lateral ou Modal central desliza.
- Se for fracionado, exibe: `Quantas cotas você gostaria de presentear?`.
- O convidado usa seletores `[-]` e `[+]`.
- O valor total autocalcula com micro-animação de troca de números (counter rolling).
- **Exceção de Loja Parceira (Importante):** O botão opcional "Comprar na Loja Parceira" **só é visível** se a barra de progresso estiver em exatamente **0%**. Se qualquer cota já tiver sido vendida, este botão é removido para evitar quebras financeiras.
- **Call to Action Principal:** `Confirmar X Cota(s) - R$ TOTAL`.

### Passo 3: Tela de Lock e Pagamento PIX
- A tela exibe o tempo de lock (3 horas).
- A instrução PIX especifica o valor exato correspondente às cotas adquiridas.

---

## ⚙️ 3. Jornada do Organizador (Painel Administrativo)

### Localização: Tela de Edição de Presente
- Abaixo do campo "Preço do Produto", há uma chave switch dourada: `[ ] Habilitar Divisão em Cotas`.
- Ao ativar a chave, um container expansível via slide exibe:
  - `Número total de cotas:` [ Input numérico ]
  - `Valor de cada cota:` [ Output dinâmico em tempo real: R$ Preço / Cotas ]
- Alertas automáticos impedem salvar se o valor resultante por cota for inferior a R$ 50,00.

---

## 📐 4. Wireframe UX Mental (Páginas Alvo)

### A. Card do Produto na Vitrine
```html
┌─────────────────────────────────────────┐
│  [ ★ PRESENTE COLETIVO ] (Badge)        │
│                                         │
│         [ Imagem da Geladeira ]         │
│                                         │
│ Geladeira Brastemp Frost Free 450L      │
│ R$ 4.200,00                             │
│                                         │
│ ─────────────────────────────────────── │
│ [▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░] 60% Arrecadado    │
│ 6 de 10 cotas adquiridas                │
│                                         │
│ [ Botão: Presentear com Cotas ]         │
└─────────────────────────────────────────┘
```

### B. Drawer de Compra
```html
┌─────────────────────────────────────────┐
│ × Fechar                                │
│                                         │
│ Geladeira Brastemp Frost Free 450L      │
│                                         │
│ Escolha a quantidade de cotas:          │
│ ┌─────┐      ┌─────┐      ┌─────┐       │
│ │  -  │  [   3   ]  │  +  │       │
│ └─────┘      └─────┘      └─────┘       │
│ 3 cotas x R$ 420,00                     │
│                                         │
│ Total a pagar: R$ 1.260,00              │
│                                         │
│ [ Botão: Gerar PIX de R$ 1.260,00 ]     │
└─────────────────────────────────────────┘
```

---
**Fluxo Validado e Pronto para Construção do Protótipo Interativo!**  
@ux-ui: Iniciando construção da interface de simulação em `docs/wireframes/cotas-presentes.html`.
