# STORY-057: Seletor de Fontes Premium no Admin (Font Picker)

## Descrição
Como organizador do casamento, desejo escolher as fontes cursiva e serifada do meu convite através de uma interface visual com preview em tempo real, para personalizar a identidade tipográfica do evento sem precisar conhecer tipografia.

## Contexto
O sistema já armazena `font_cursive` e `font_serif` no banco. A UI de configuração atual provavelmente usa um campo de texto ou dropdown simples. Esta story transforma isso em uma experiência de escolha visual rica, com **suporte especial a cursivas exageradas/dramáticas** conforme solicitado pelo stakeholder.

---

## Critérios de Aceitação

### 1. Galeria de Fontes Cursivas
- Exibir grade visual de **10-15 opções de fontes cursivas**, incluindo obrigatoriamente:
  - **Exageradas/Dramáticas:** Pinyon Script, Great Vibes, Playlist Script, Alex Brush, Corinthia
  - **Moderadas:** Dancing Script, Sacramento, Pacifico, Satisfy
  - **Vintage:** Ruthie, Euphoria Script, Herr Von Muellerhoff
- Cada card mostra "Layslla & Marcus" (nomes reais do evento) renderizados na fonte
- Card selecionado: borda dourada + check badge

### 2. Galeria de Fontes Serifadas
- **8-10 opções editoriais/elegantes:**
  - Cormorant Garamond, Playfair Display, EB Garamond, Libre Baskerville
  - Lora, Merriweather, Crimson Text, Gentium Plus
- Preview mostra: "Celebrando o amor" em corpo + "você foi convidado" em destaque

### 3. Preview em Tempo Real (Live Preview Panel)
- Painel lateral ou inferior mostra miniatura do convite com as fontes selecionadas aplicadas
- Ambas as fontes aparecem juntas no preview — sem precisar salvar para ver o resultado
- Preview inclui: título cursivo (nome do casal) + parágrafo serifado (texto de convite)

### 4. Carregamento das Fontes
- Usar **Google Fonts API** com `font-display: swap` para evitar FOUC
- Lazy load apenas das fontes nos cards (preview cards usam `&text=Layslla+%26+Marcus` param do GFont para otimizar request)
- Fonte selecionada carregada em full weight + italic

### 5. Persistência
- Ao clicar em "Salvar" (`configService.update()`), gravar `font_cursive` e `font_serif` no banco
- Refletir imediatamente no preview do convite público (via `EventContext`)

---

## Wireframe dos Cards de Fonte

```
┌──────────────────────────┐
│  Pinyon Script           │   ← Nome da fonte pequeno, caps
│                          │
│  Layslla & Marcus        │   ← Preview em tamanho grande (28-32px)
│  (em Pinyon Script)      │
│                          │
│  ✓ Selecionada           │   ← Badge quando ativa (accent_color)
└──────────────────────────┘
```

---

## Especificação Técnica

### Componente Novo
```
src/components/admin/FontPicker/
├── FontPicker.tsx             ← wrapper com tabs "Cursiva" / "Serifada"
├── FontCard.tsx               ← card individual de fonte com preview
├── FontPreviewPanel.tsx       ← painel de preview ao vivo
└── FontPicker.module.css
```

### Constantes de Fontes
```typescript
// src/lib/constants/fonts.ts
export const CURSIVE_FONTS = [
  { name: 'Pinyon Script', googleFamily: 'Pinyon+Script', category: 'dramatic' },
  { name: 'Great Vibes', googleFamily: 'Great+Vibes', category: 'dramatic' },
  { name: 'Alex Brush', googleFamily: 'Alex+Brush', category: 'dramatic' },
  { name: 'Corinthia', googleFamily: 'Corinthia', category: 'ultra-dramatic' },
  { name: 'Dancing Script', googleFamily: 'Dancing+Script', category: 'moderate' },
  // ...
];

export const SERIF_FONTS = [
  { name: 'Cormorant Garamond', googleFamily: 'Cormorant+Garamond', category: 'editorial' },
  { name: 'Playfair Display', googleFamily: 'Playfair+Display', category: 'classic' },
  // ...
];
```

### Integração no Admin
- Substituir os inputs de texto por `<FontPicker type="cursive" />` e `<FontPicker type="serif" />` dentro de `configuracoes/page.tsx`

---

## Prioridade: 🟡 Alta (Sprint 1)
## Esforço: M (4-5h)
## Status: 📋 TODO
## Epic: EPIC-007 (Visual Branding)

## Dependências
- ✅ `configuracoes` com campos `font_cursive` e `font_serif`
- ✅ `configService.update()` já implementado
- ⚠️ STORY-055 (build fix) — pré-requisito
