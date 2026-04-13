# STORY-056: Experiência de Abertura do Envelope (Invite Gateway)

## Descrição
Como convidado, desejo que ao acessar meu link de convite, seja apresentado a uma experiência cinematográfica de abertura de envelope digital, que me prepare emocionalmente para o convite e deixe claro que sou esperado nessa celebração especial.

## Contexto — Por Que Este Feature Existe
O convite digital tem o poder de substituir e superar o convite físico. Um envelope de papel cria antecipação e cerimônia. Este feature replica digitalmente essa experiência com movimento, animação e texto cinematográfico antes de revelar o convite completo.

---

## Fluxo de Experiência Completo

```
[Acessa /inv/[slug]]
       │
       ▼
[FASE 1 — ENVELOPE]
Envelope fechado centralizado na tela
↳ Selo de cera com monograma do casal
↳ Texto: "Toque para abrir"
↳ Pulsação suave no selo (loop infinito)
       │
     [TAP/CLICK]
       │
       ▼
[FASE 2 — ABERTURA]
Animação de envelope se abrindo
↳ Flap superior se dobra para cima (CSS transform + ease-in-out)
↳ Partículas ou pétalas saem do envelope (opcional)
↳ Duração: ~800ms
       │
       ▼
[FASE 3 — SEQUÊNCIA ANIMADA — 3 frames]

Frame 1 (~2s):
  "Você foi convidado"
  ↳ Título em cursiva exagerada, letra por letra (typewriter effect)
  ↳ Fade-in suave de baixo para cima

Frame 2 (~2s):
  "Para celebrar"   ← corpo serifado, pequeno
  "esta união"      ← cursiva grande, abaixo
  ↳ Fade-in + ilustração botânica aparece nas laterais

Frame 3 (~2s, com pausa):
  "[Nome da Noiva] & [Nome do Noivo]"   ← cursiva exagerada, enorme
  "[Data do Evento]"                    ← caps serifadas, small
  ↳ Glow suave ao redor do "&"
       │
 [AUTO ou SKIP button]
       │
       ▼
[FADE OUT — 400ms]
       │
       ▼
[CONVITE COMPLETO — como existe hoje]
```

---

## Critérios de Aceitação

### Comportamento
- [ ] **DADO** que o convidado acessa `/inv/[slug]` pela primeira vez
- [ ] **QUANDO** a página carrega, o envelope é exibido centralizado na tela
- [ ] **ENTÃO** ao tocar/clicar, a animação de abertura inicia sequencialmente

### Skip e Acessibilidade
- [ ] Botão "Pular" discreto no canto superior direito (visível após 1s)
- [ ] Se `prefers-reduced-motion` estiver ativo, pular direto para o convite sem animação
- [ ] Toda a sequência tem `aria-live` para leitores de tela

### Persistência (UX gentil)
- [ ] Após a primeira exibição, salvar `envelope_opened = true` no `localStorage` com chave por slug
- [ ] Em visitas seguintes: exibir mini-animação "fade-in do convite" (sem repetir o envelope completo)
- [ ] Link com `?preview=true` força re-exibição do envelope (para o noivo/noiva prévisualizarem)

### Personalização (usando dados do evento)
- [ ] Monograma no selo gerado dinamicamente com as iniciais do casal
- [ ] Cor do selo vinculada ao `accent_color` do evento (configurável no admin)
- [ ] Fontes dos frames 1-3 vinculadas ao `font_cursive` e `font_serif` do evento
- [ ] Nomes e data carregados de `configuracoes` do evento

### Performance
- [ ] Todo CSS keyframe inline ou em módulo separado (não bloqueia render)
- [ ] Imagens do envelope: SVG vetorial (sem requests externos pesados)
- [ ] TTI (Time to Interactive) do envelope < 1.5s mesmo em 4G lento

---

## Especificação Técnica

### Novo Componente
```
src/components/public/EnvelopeGateway/
├── EnvelopeGateway.tsx        ← componente principal, orquestra fases
├── EnvelopeClosed.tsx         ← fase 1: envelope fechado com selo
├── EnvelopeOpening.tsx        ← fase 2: animação de abertura
├── RevealSequence.tsx         ← fase 3: frames de texto animados
└── EnvelopeGateway.module.css ← todos os keyframes e animações
```

### Integração na rota pública
```tsx
// src/app/(public)/inv/[slug]/page.tsx
// Wrappear o convite existente com o gateway
<EnvelopeGateway config={configuracoes} onComplete={() => setShowInvite(true)}>
  {/* convite atual fica aqui */}
  <InviteContent ... />
</EnvelopeGateway>
```

### Animações CSS Necessárias
```css
@keyframes flap-open { /* rotação do topo do envelope */ }
@keyframes typewriter { /* revelação letra-a-letra do texto */ }
@keyframes fade-up { /* entrada suave dos frames de texto */ }
@keyframes float-petals { /* partículas opcionais */ }
@keyframes glow-pulse { /* pulsação do selo */ }
```

---

## Nível de Polimento Esperado

| Elemento | Qualidade mínima | Qualidade ideal |
|----------|-----------------|-----------------|
| Envelope | Forma CSS simples | Papel texturizado com SVG grain |
| Selo de cera | Círculo colorido com letra | Detalhe de cera SVG com brilho |
| Animação flap | CSS transform simples | Curva de bezier orgânica |
| Texto animado | Fade-in bloco | Typewriter letra-a-letra |
| Partículas | Opcional | 10-15 mini-pétalas CSS |
| Música | ❌ NUNCA | — |

---

## Prioridade: 🔴 Alta (Sprint 1)
## Esforço: L (6-8h)
## Status: 📋 TODO
## Epic: EPIC-007 (Visual Branding)

## Dependências
- ✅ `configuracoes` com `font_cursive`, `font_serif`, `accent_color`, `nome_noiva`, `nome_noivo`, `data_casamento`
- ✅ Rota `/inv/[slug]` existente
- ⚠️ STORY-049 (build funcional) — deve estar resolvida
