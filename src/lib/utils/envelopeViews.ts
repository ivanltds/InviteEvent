/**
 * Controla quantas vezes a animação de abertura do envelope (STORY-056)
 * já foi mostrada neste dispositivo para um determinado convite, pra não
 * repetir a animação a cada visita. Extraído em 20/09/2026 de
 * `/inv/[slug]` pra ser reaproveitado também em `/inv/evento/[eventoSlug]`
 * (modo Link Único), que até então tinha a animação sempre desligada
 * (`showGateway={false}` fixo) — bug reportado pelo usuário.
 */

const STORAGE_KEY_PREFIX = 'envelope_views_';
const MAX_VIEWS = 3;

/** true quando a animação já foi vista o suficiente e deve ser pulada. */
export function hasExceededViewLimit(key: string, forcePreview: boolean): boolean {
  if (forcePreview || key === 'preview') return false; // ?preview=true ou slug/key 'preview' força re-exibição
  try {
    const views = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`) || '0', 10);
    return views >= MAX_VIEWS;
  } catch {
    return false;
  }
}

export function incrementViewCount(key: string): void {
  try {
    const views = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`) || '0', 10);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, (views + 1).toString());
  } catch {
    // Ignora se estiver no modo anônimo, por exemplo
  }
}
