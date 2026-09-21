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

const storageKeyPrefix = 'link_unico_convite_';
const storageKey = (eventoSlug: string) => `${storageKeyPrefix}${eventoSlug}`;

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

export function clearSavedConvite(eventoSlug: string): void {
  try {
    localStorage.removeItem(storageKey(eventoSlug));
  } catch {
    // localStorage indisponível — nada a limpar.
  }
}

/**
 * Varre o localStorage deste dispositivo procurando qual evento (Link
 * Único) tem justamente este slug de convite salvo, e devolve o slug do
 * EVENTO (não do convite) — extraído da própria chave salva, sem precisar
 * de outra consulta ao banco. Usada em dois cenários, ambos pedidos pelo
 * usuário em 20/09/2026:
 *
 * 1) O convite salvo foi excluído (ex.: pelo admin) e o convidado fica
 *    preso pra sempre num "Convite não encontrado", porque o dispositivo
 *    sempre redireciona pro mesmo slug morto. Achar o eventoSlug permite
 *    "zerar" (clearSavedConvite) e mandar o convidado de volta pro
 *    cadastro, em vez de um beco sem saída.
 * 2) Uma segunda pessoa, no MESMO dispositivo/navegador de quem já
 *    confirmou, precisa confirmar a presença dela separadamente — o
 *    dispositivo só "lembra" um convidado por evento. Achar o eventoSlug
 *    permite oferecer um link pra ela se cadastrar por conta própria.
 */
export function findEventoSlugForSavedConvite(conviteSlug: string): string | null {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(storageKeyPrefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.slug === conviteSlug) {
          return key.slice(storageKeyPrefix.length);
        }
      } catch {
        // Entrada corrompida — ignora e segue procurando.
      }
    }
  } catch {
    // localStorage indisponível.
  }
  return null;
}
