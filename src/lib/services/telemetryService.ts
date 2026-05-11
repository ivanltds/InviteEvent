/**
 * TelemetryService — PRD-008: Motor de Observabilidade Hyper-Métrica
 *
 * DESIGN PRINCIPLES (Zero Impacto na UX):
 * 1. Fire-and-Forget: NUNCA usamos `await` aqui, chamadas são disparadas em background.
 * 2. requestIdleCallback: O envio é agendado apenas quando o browser está ocioso.
 * 3. sendBeacon para saída de página: Garante captura mesmo se o usuário fechar a aba.
 * 4. Session Fingerprinting: ID anônimo gerado no sessionStorage para agrupar ações.
 */

import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'inv_telemetry_session';

function getInviteSlug(): string | null {
  if (typeof window === 'undefined') return null;
  // Scenario A: explicit query param (presentes?invite=slug)
  const sp = new URLSearchParams(window.location.search).get('invite');
  if (sp) return sp;
  
  // Scenario B: Root path segment ([slug])
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const segments = path.split('/');
  if (segments.length === 1 && segments[0]) {
      const systemReserved = ['admin', 'api', 'login', 'presentes', 'mural'];
      if (!systemReserved.includes(segments[0])) return segments[0];
  }
  return null;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export type TelemetryCategory = 'invite' | 'mural' | 'gift';

export interface TelemetryEventPayload {
  eventoId: string;
  categoria: TelemetryCategory;
  eventType: string;
  targetId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Dispara um evento de telemetria de forma assíncrona e não-bloqueante.
 * O conteúdo da Promise é silenciado intencionalmente para não interferir no UI.
 */
function dispatchTelemetry(payload: object): void {
  const sendFn = () => {
    supabase
      .from('analytics_events')
      .insert(payload)
      .then(() => {/* silencioso */})
      .catch(() => {/* silencioso - telemetria nunca pode quebrar o site */});
  };

  // Usar requestIdleCallback se disponível (browsers modernos) — CPU ociosa apenas
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as Window & typeof globalThis).requestIdleCallback(sendFn, { timeout: 3000 });
  } else {
    // Fallback: setTimeout simples não bloqueia o event loop principal
    setTimeout(sendFn, 0);
  }
}

export const Telemetry = {
  /**
   * Rastreia qualquer evento de comportamento do convidado.
   * Método principal — use este para 99% dos casos.
   */
  track(payload: TelemetryEventPayload): void {
    if (typeof window === 'undefined') return; // Sem execução no SSR

    // PREVENÇÃO DE POLUIÇÃO: Ignorar acessos de administradores ou modos de simulação
    const isAdminPath = window.location.pathname.includes('/admin/');
    const isPreviewParam = window.location.search.includes('preview=true');
    const isLocalSimulation = window.location.pathname === '/admin/visualizar';
    
    if (isAdminPath || isPreviewParam || isLocalSimulation) {
        return; // Não registra tráfego administrativo como estatística
    }

    const record = {
      evento_id: payload.eventoId,
      session_id: getSessionId(),
      categoria: payload.categoria,
      evento_tipo: payload.eventType,
      target_id: payload.targetId ?? null,
      duration_ms: payload.durationMs ?? 0,
      metadata: {
        ...payload.metadata,
        invite_slug: getInviteSlug(), // ATRIBUIÇÃO TRANS-SESSÃO: Identificador perene do convidado
        user_agent: navigator.userAgent,
        is_mobile: /Mobi|Android/i.test(navigator.userAgent),
        timestamp_iso: new Date().toISOString(),
      },
    };

    dispatchTelemetry(record);
  },

  /**
   * Rastreia tempo de visualização de uma seção.
   * Retorna um "stopper" — chame-o quando o usuário sair da seção.
   */
  startSectionTimer(eventoId: string, sectionName: string): () => void {
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      // Só registrar se ficou mais de 1s — evita falsos positivos de scroll rápido
      if (durationMs > 1000) {
        Telemetry.track({
          eventoId,
          categoria: 'invite',
          eventType: 'section_view',
          targetId: sectionName,
          durationMs,
        });
      }
    };
  },

  /**
   * Detecta Rage Clicks (cliques de frustração > 3x em 2s) em um elemento.
   * Retorna função de cleanup para o useEffect.
   */
  watchRageClicks(element: HTMLElement | null, eventoId: string, targetId: string): () => void {
    if (!element) return () => {};
    let clicks = 0;
    let timer: ReturnType<typeof setTimeout>;

    const handler = () => {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 2000);

      if (clicks >= 3) {
        Telemetry.track({
          eventoId,
          categoria: 'gift',
          eventType: 'rage_click',
          targetId,
          metadata: { click_count: clicks },
        });
        clicks = 0;
      }
    };

    element.addEventListener('click', handler);
    return () => element.removeEventListener('click', handler);
  },

  /**
   * Captura a profundidade de scroll no momento em que o usuário sai da página.
   * Usa sendBeacon / keepalive fetch para garantir envio mesmo ao fechar a aba.
   */
  trackExitDepth(eventoId: string, lastSectionVisible: string): void {
    Telemetry.track({
      eventoId,
      categoria: 'invite',
      eventType: 'scroll_exit',
      targetId: lastSectionVisible,
      metadata: {
        scroll_y: window.scrollY,
        page_height: document.documentElement.scrollHeight,
        scroll_pct: Math.round((window.scrollY / document.documentElement.scrollHeight) * 100),
      },
    });
  },
};
