# STORY-058: [BUG] Contraste Insuficiente no Admin com Cores Customizadas

## Tipo: Bug / UX Deficit
## Severidade: 🔴 Alta (WCAG AA fail + experiência de usuário quebrada)

## Descrição do Problema
Quando o organizador configura uma cor de fundo clara (ex: marfim `#fdfbf7`, amarelo claro, rosa claro) no admin, essa cor é aplicada ao **chrome de navegação** (sidebar, header, botões de nav), tornando o texto branco ou claro **invisível ou ilegível**.

### Cenários de falha identificados
1. **Sidebar:** Background da sidebar assume a cor configurada → texto/ícones brancos desaparecem
2. **Header mobile:** Background do header mobile sem contraste com hamburguer icon
3. **Botões de ação:** Botões que usam `accent_color` como background ficam ilegíveis se a cor for clara
4. **Badges/Status:** Badges de quantidade de convidados sem contraste quando accent é claro

---

## Raiz do Problema (Root Cause)

As CSS Custom Properties de cores do evento provavelmente são injetadas globalmente (`:root`) e sobrescrevem variáveis usadas pelo admin chrome.

Exemplo problemático:
```css
/* configuracoes aplica globalmente: */
:root {
  --bg-primary: var(--evento-bg-primary);    /* ← problema! admin usa isso pra sidebar */
  --accent-color: var(--evento-accent);       /* ← problem! botões de nav usam isso */
}
```

---

## Solução Proposta (UX — Uma)

### Princípio: **Escopo de Cores**
As cores do evento devem ser **scoped** apenas ao convite público. O admin chrome deve ter seu próprio sistema de cores fixo e inviolável.

```
📦 CSS Architecture:
├── Admin Chrome Colors (FIXAS, dark theme, sempre legível)
│   └── --admin-sidebar-bg: #1a1a2e
│   └── --admin-header-bg: #16213e
│   └── --admin-text: #e8e8f0
│
└── Event Colors (SCOPED ao preview e ao convite público)
    └── .event-theme { --bg-primary: ...; --accent-color: ...; }
    └── Apenas elementos com class .event-theme herdam as cores
```

### Implementação Necessária

**1. Criar escopo `.event-theme`**
```css
/* src/app/(public)/inv/[slug]/invite.module.css */
.eventTheme {
  --bg-primary: var(--evento-bg);
  --text-main: var(--evento-text);
  --accent: var(--evento-accent);
}
```

**2. Limpar `:root` do admin de variáveis de evento**
```css
/* src/app/(admin)/AdminLayout.module.css */
.adminLayout {
  /* Admin sempre usa estas cores — independente do evento */
  --sidebar-bg: #1a1a2e;
  --header-bg: #16213e;
  --nav-text: #e8e8f0;
  --nav-active: #6c63ff;
  --nav-hover: rgba(255,255,255,0.08);
}
```

**3. Preview de Cores no Admin usa escopo próprio**
- O mini-preview de cores em `/admin/configuracoes` deve usar `.event-theme` wrapper
- Isso mostra ao organizador como as cores ficam no convite, sem afetar o admin

**4. Validação de Contraste no Color Picker**
- Ao selecionar uma cor, calcular contrast ratio com branco e preto (WCAG formula)
- Avisar se a cor escolhida como `accent_color` tem ratio < 4.5:1 com o texto sobreposto
- UI: pequeno badge "✅ Bom contraste" ou "⚠️ Contraste baixo — considere uma cor mais escura"

---

## Critérios de Aceitação

- [ ] **DADO** qualquer cor configurada pelo admin
- [ ] **QUANDO** o organizador navega pelo painel admin
- [ ] **ENTÃO** texto, ícones e botões da sidebar e header são sempre legíveis (WCAG AA min 4.5:1)

- [ ] **DADO** que o admin escolhe cor `#fdfbf7` (marfim)
- [ ] **QUANDO** aplica e recarrega o admin
- [ ] **ENTÃO** a sidebar permanece em dark theme inviolável e o convite público reflete a cor escolhida

- [ ] **DADO** que o admin escolhe color accent
- [ ] **QUANDO** a cor tem baixo contraste com texto branco
- [ ] **ENTÃO** aparece aviso visual `⚠️ Contraste baixo` sem bloquear a escolha

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/app/(admin)/AdminLayout.module.css` | Fixar variáveis de cor do admin como hardcoded/constantes |
| `src/app/(admin)/admin/configuracoes/page.tsx` | Remover inject global de cor do evento no `:root` |
| `src/app/(public)/inv/[slug]/page.tsx` | Wrappear convite com `.event-theme` class |
| `src/components/admin/ColorPicker` (novo) | Adicionar feedback de contraste WCAG |

---

## Prioridade: 🟡 Alta (Sprint 1 — antes do deploy)
## Esforço: S (2-3h)
## Status: 📋 TODO
## Epic: EPIC-010 (Security & Quality) + EPIC-007 (Visual)

## Dependências
- ⚠️ STORY-055 (build fix) — pré-requisito
- Independente de outras stories de visual
