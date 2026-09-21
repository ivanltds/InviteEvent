/** Os mesmos modelos definidos em src/app/api/og/convite/route.tsx. */
export const CARD_TEMPLATES = ['classico', 'circular', 'retrato', 'minimalista', 'romantico', 'colorido'] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export const CARD_TEMPLATE_LABELS: Record<CardTemplate, string> = {
  classico: 'Clássico',
  circular: 'Foto Circular',
  retrato: 'Retrato',
  minimalista: 'Minimalista',
  romantico: 'Romântico',
  colorido: 'Colorido (cor do tema)',
};

/**
 * Monta a URL do cartão de convite gerado dinamicamente (ver
 * src/app/api/og/convite/route.tsx) — nomes do casal + data sobre a
 * foto, no modelo escolhido pelos noivos. Extraído de
 * src/lib/metadata/inviteMetadata.ts pra ser reaproveitado também no
 * client (ex.: compartilhar o cartão como imagem de verdade via Web
 * Share API, ou mostrar as prévias dos modelos em Configurações), sem
 * depender de nada server-only.
 */
export function buildConviteCardImageUrl(
  params: { noiva: string; noivo: string; data?: string; foto?: string; template?: string; accentColor?: string },
  baseUrl: string
): string {
  const qs = new URLSearchParams({ noiva: params.noiva, noivo: params.noivo });
  if (params.data) qs.set('data', params.data);
  if (params.foto) qs.set('foto', params.foto);
  if (params.template) qs.set('template', params.template);
  if (params.accentColor) qs.set('cor', params.accentColor);
  return `${baseUrl}/api/og/convite?${qs.toString()}`;
}
