# Plano de Arquitetura Final - PRD-008 (Alta Performance e Zero Impacto) 🏗️🚀
> Responsável: @architect | Maestro Final Review | Data: 2026-05-11

Este plano garante a instrumentação de dados exigida pelo PRD-008 com garantia matemática de **0% de atraso na experiência do convidado**. A arquitetura operará em regime "Low Priority Shadowing".

---

## 1. Pilares de Engenharia de Performance (Zero Impacto)

Para assegurar que a telemetria não degrade o carregamento ou rolagem do site:

1.  **Estratégia "Fire-and-Forget" (Dispare e Esqueça)**:
    *   Nunca faremos `await` nas inserções de telemetria. As chamadas do Supabase rodarão em background Promises, permitindo que o UI Thread do React renderize sem esperar resposta do servidor.
2.  **Uso de `requestIdleCallback`**:
    *   O envio de dados curtos será agendado via `window.requestIdleCallback` (quando o navegador estiver ocioso), garantindo 0 de interferência com animações ou transições de tela.
3.  **Throttle & Debounce de Sensores**:
    *   Scroll Trackers usarão `IntersectionObserver` nativo (altamente performático) com um atraso intencional de **150ms** para registrar visibilidade, evitando sobrecarga na CPU durante rolagem rápida.
4.  **Fetch Keepalive & Beacon**:
    *   Para capturar a saída da página (fechamento de aba), usaremos `navigator.sendBeacon` ou `fetch(..., { keepalive: true })`, assegurando que o dado chegue ao banco sem atrasar o fechamento do navegador pelo usuário.

---

## 2. Viabilidade e Oportunidade Atual (O Que Já Existe x Nova Instrumentação)

Avaliamos o código atual e mapeamos a viabilidade de inserção imediata:

| Elemento a Medir | Onde está hoje? | Viabilidade de Rastreio | Esforço |
| :--- | :--- | :--- | :--- |
| **Abertura de Modal Presente** | `Presentes.tsx (handleOpenCheckout)` | **100% Alta**. Já temos o hook de abertura, basta injetar a chamada ao TelemetryService. | Baixo |
| **Click Link Externo** | `Presentes.tsx (Link comprar na loja)`| **100% Alta**. Adicionar `onClick={() => trackEvent()}`. | Baixo |
| **Tempo de Seção (Scroll)** | `LiveInviteView.tsx` | **Média**. Criaremos o wrapper `<TrackedSection>` para encapsular componentes de Agenda, História, etc. | Médio |
| **Tentativas de Pagamento** | `Checkout` | **Alta**. Injetar no bloco `try/catch` do processo de upload do comprovante. | Baixo |

---

## 3. Especificação Técnica do Telemetry Service

Criaremos `src/lib/services/telemetryService.ts` expondo:

```typescript
export const Telemetry = {
  trackEvent: async (category, type, metadata = {}) => {
    // Implementação interna
    const payload = { ...contextData, ...metadata };
    
    // Dispatch assíncrono sem await para bloquear NADA
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        supabase.from('analytics_events').insert(payload).then(); // .then() silenciado
      });
    } else {
      // Fallback imediato background
      supabase.from('analytics_events').insert(payload).then();
    }
  }
}
```

---

## 4. Roteiro Técnico de Execução (Sprints de Dev)

### Sprint 1: O Alicerce Silencioso
1.  Migration da tabela `analytics_events` com RLS INSERT_ONLY (Pública).
2.  Criação do `TelemetryService.ts` e geração automática de `sessionId` no SessionStorage.

### Sprint 2: Instrumentação de Vendas (Gifts)
1.  Injeção de gatilhos no `Presentes/page.tsx` (Modal, Link Externo, Click no Carrinho).
2.  Injeção de gatilhos no Fluxo de Checkout (Sucesso/Erro/Retry).

### Sprint 3: Rastreamento Espacial (Scroll Depth)
1.  Criação do Hook `useIntersectionTelemetry`.
2.  Envelopamento das seções do convite em `LiveInviteView.tsx`.

---
*Plano homologado pelo Arquiteto. Nenhum gargalo de performance detectado no design. Pronto para ordens de construção.*
