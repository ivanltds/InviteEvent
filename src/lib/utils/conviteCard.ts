/** Os mesmos modelos definidos em src/app/api/og/convite/route.tsx. */
export const CARD_TEMPLATES = ['classico', 'classico_convite', 'circular', 'retrato', 'minimalista', 'romantico', 'colorido'] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export const CARD_TEMPLATE_LABELS: Record<CardTemplate, string> = {
  classico: 'Clássico',
  classico_convite: 'Clássico com Convite',
  circular: 'Foto Circular',
  retrato: 'Retrato',
  minimalista: 'Minimalista',
  romantico: 'Romântico',
  colorido: 'Colorido (cor do tema)',
};

/**
 * Personalização de UM modelo de cartão (pedido do usuário em
 * 21/09/2026: fonte, tamanho da fonte e tamanho/zoom da foto,
 * independentes para cada um dos 6 modelos). `font` é o `googleFamily`
 * de um item de `CURSIVE_FONTS` (src/lib/constants/fonts.ts) — as
 * mesmas fontes já usadas em "Tipografia Premium". `fontScale`/
 * `imageScale` são percentuais (100 = tamanho calibrado padrão de cada
 * modelo).
 */
export interface CardTemplateStyle {
  font?: string;
  fontScale?: number;
  /** Percentual do tamanho da fonte da data (100 = tamanho calibrado padrão de cada modelo). */
  dateFontScale?: number;
  /** URL da foto escolhida pro cartão desse modelo; vazio = usa o fallback automático (hero_images[0]/fotos individuais). */
  image?: string;
  imageScale?: number;
}

export type CardTemplateStyles = Partial<Record<CardTemplate, CardTemplateStyle>>;

/**
 * Monta a URL do cartão de convite gerado dinamicamente (ver
 * src/app/api/og/convite/route.tsx) — nomes do casal + data sobre a
 * foto, no modelo escolhido pelos noivos, com a fonte/tamanho/zoom
 * escolhidos pra esse modelo. Extraído de
 * src/lib/metadata/inviteMetadata.ts pra ser reaproveitado também no
 * client (ex.: compartilhar o cartão como imagem de verdade via Web
 * Share API, ou mostrar as prévias dos modelos em Configurações), sem
 * depender de nada server-only.
 */
export function buildConviteCardImageUrl(
  params: {
    noiva: string;
    noivo: string;
    data?: string;
    foto?: string;
    template?: string;
    accentColor?: string;
    font?: string;
    fontScale?: number;
    dateFontScale?: number;
    imageScale?: number;
  },
  baseUrl: string
): string {
  const qs = new URLSearchParams({ noiva: params.noiva, noivo: params.noivo });
  if (params.data) qs.set('data', params.data);
  if (params.foto) qs.set('foto', params.foto);
  if (params.template) qs.set('template', params.template);
  if (params.accentColor) qs.set('cor', params.accentColor);
  if (params.font) qs.set('fonte', params.font);
  if (params.fontScale) qs.set('escala', String(params.fontScale));
  if (params.dateFontScale) qs.set('escalaData', String(params.dateFontScale));
  if (params.imageScale) qs.set('zoom', String(params.imageScale));
  return `${baseUrl}/api/og/convite?${qs.toString()}`;
}
