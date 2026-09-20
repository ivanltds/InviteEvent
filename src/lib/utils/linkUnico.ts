/**
 * Persistência local do convite auto-cadastrado pelo convidado no modo
 * "Link Único" (mesmo padrão já usado pelo `guest_session_id` do lock de
 * presentes). Sem localStorage disponível (modo privado, navegador
 * restritivo), o convidado simplesmente refaz o auto-cadastro na próxima
 * visita — degradação aceita conscientemente (ver docs da feature).
 */

interface SavedConvite {
  slug: string;
}

const storageKey = (eventoSlug: string) => `link_unico_convite_${eventoSlug}`;

export function getSavedConvite(eventoSlug: string): SavedConvite | null {
  try {
    const raw = localStorage.getItem(storageKey(eventoSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.slug === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConvite(eventoSlug: string, conviteSlug: string): void {
  try {
    localStorage.setItem(storageKey(eventoSlug), JSON.stringify({ slug: conviteSlug }));
  } catch {
    // localStorage indisponível — segue sem salvar, degradação aceita.
  }
}
