/**
 * Gera links de navegação (Google Maps / Waze) a partir de um endereço em
 * texto, para quando o marco da agenda não tem um link específico
 * cadastrado manualmente pelos noivos. Pedido do usuário em 20/09/2026:
 * todo endereço marcado no evento deve ajudar o convidado a chegar lá,
 * não só os que tiveram o link preenchido à mão no admin.
 */
export function buildGoogleMapsUrl(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

export function buildWazeUrl(endereco: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`;
}

/**
 * Resolve o link efetivo: usa o link manual cadastrado, se houver, e cai
 * para o link gerado a partir do endereço/nome do local caso contrário.
 * Retorna `null` quando não há endereço nenhum para navegar.
 */
export function resolveGoogleMapsUrl(enderecoOuLocal: string | undefined, linkManual?: string): string | null {
  if (linkManual && linkManual.trim()) return linkManual.trim();
  if (enderecoOuLocal && enderecoOuLocal.trim()) return buildGoogleMapsUrl(enderecoOuLocal.trim());
  return null;
}

export function resolveWazeUrl(enderecoOuLocal: string | undefined, linkManual?: string): string | null {
  if (linkManual && linkManual.trim()) return linkManual.trim();
  if (enderecoOuLocal && enderecoOuLocal.trim()) return buildWazeUrl(enderecoOuLocal.trim());
  return null;
}

/**
 * URL de um mapa do Google Maps incorporável em <iframe>, sem precisar de
 * chave de API (modo "output=embed" do próprio Google Maps) — pedido do
 * usuário em 20/09/2026: mostrar o mapa visualmente no convite, não só
 * links pra abrir em outro app.
 */
export function buildGoogleMapsEmbedUrl(endereco: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
}

export function resolveGoogleMapsEmbedUrl(enderecoOuLocal: string | undefined): string | null {
  if (enderecoOuLocal && enderecoOuLocal.trim()) return buildGoogleMapsEmbedUrl(enderecoOuLocal.trim());
  return null;
}
