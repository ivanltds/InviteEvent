/**
 * Monta a URL do cartão de convite gerado dinamicamente (ver
 * src/app/api/og/convite/route.tsx) — nomes do casal + data sobre a
 * foto. Extraído de src/lib/metadata/inviteMetadata.ts pra ser
 * reaproveitado também no client (ex.: compartilhar o cartão como
 * imagem de verdade via Web Share API), sem depender de nada
 * server-only.
 */
export function buildConviteCardImageUrl(
  params: { noiva: string; noivo: string; data?: string; foto?: string },
  baseUrl: string
): string {
  const qs = new URLSearchParams({ noiva: params.noiva, noivo: params.noivo });
  if (params.data) qs.set('data', params.data);
  if (params.foto) qs.set('foto', params.foto);
  return `${baseUrl}/api/og/convite?${qs.toString()}`;
}
