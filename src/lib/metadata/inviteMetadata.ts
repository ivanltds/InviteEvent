import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Gera o Open Graph/Twitter Card de cada convite (foto do casal + nome +
 * data) para o link aparecer com um cartão de verdade ao ser colado no
 * WhatsApp — pedido do usuário em 20/09/2026, evidenciado por um print
 * mostrando o card genérico do app (ícone + descrição fixa) em vez do
 * casal específico.
 *
 * `/inv/[slug]/page.tsx` e `/inv/evento/[eventoSlug]/page.tsx` são Client
 * Components (usam useState/useEffect/localStorage), e Client Components
 * não podem exportar `generateMetadata`. Por isso cada uma vira um Server
 * Component fino que só busca os dados aqui (nova consulta pública, leve)
 * e delega toda a renderização pro componente client existente — sem
 * duplicar a lógica de fetch client-side já usada para a tela em si.
 */

const APP_NAME = 'InviteEventAI';

const FALLBACK_METADATA: Metadata = {
  title: APP_NAME,
  description: 'Convites de casamento digitais, RSVP e lista de presentes inteligente.',
};

function getBaseUrl(): string {
  // Ordem importa: NEXT_PUBLIC_SITE_URL (se algum dia for configurada) e o
  // domínio estável de produção vêm antes de VERCEL_URL, que é a URL de
  // CADA deploy (muda a cada push) — usá-la geraria um og:url/imagem
  // diferente a cada deploy em vez do domínio fixo que os convidados
  // realmente acessam. VERCEL_URL só é útil como fallback em previews.
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_ENV === 'production') return 'https://invite-event-beryl.vercel.app';
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://invite-event-beryl.vercel.app';
}

// Cliente Supabase anônimo dedicado a metadata: sem cookies/headers (não
// precisa de sessão — os dados aqui já são públicos via RLS, os mesmos
// que a tela do convidado lê no client) e sem custo de `await headers()`.
function getPublicSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

function formatDataCasamento(dataCasamento?: string): string {
  if (!dataCasamento) return '';
  const [year, month, day] = dataCasamento.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Correção de 20/09/2026: og:image era a foto crua do casal (só
 * recortada 1200x630 via Cloudinary) — o usuário pediu um cartão de
 * verdade, com os nomes do casal em tipografia elegante sobre a foto e a
 * data, como um convite tradicional. Em vez de servir a foto direto,
 * montamos a URL de /api/og/convite (src/app/api/og/convite/route.tsx),
 * que gera esse cartão dinamicamente via ImageResponse (next/og) — a
 * composição final sempre sai 1200x630, então não precisamos mais do
 * recorte via Cloudinary aqui.
 */
function buildConviteCardImageUrl(params: { noiva: string; noivo: string; data?: string; foto?: string }): string {
  const qs = new URLSearchParams({ noiva: params.noiva, noivo: params.noivo });
  if (params.data) qs.set('data', params.data);
  if (params.foto) qs.set('foto', params.foto);
  return `${getBaseUrl()}/api/og/convite?${qs.toString()}`;
}

function buildMetadataFromConfig(config: any, path: string): Metadata {
  const noiva = config.noiva_nome?.trim();
  const noivo = config.noivo_nome?.trim();
  const title = noiva && noivo ? `${noiva} & ${noivo}` : APP_NAME;
  const dataFormatada = formatDataCasamento(config.data_casamento);

  const description = dataFormatada
    ? `Você está convidado(a) para o casamento de ${noiva} & ${noivo}, em ${dataFormatada}. Confirme sua presença!`
    : `Você está convidado(a) para o casamento de ${noiva} & ${noivo}. Confirme sua presença!`;

  // Prioriza a primeira imagem do carrossel (geralmente uma foto do
  // casal), caindo para as fotos individuais cadastradas se não houver.
  const rawImage: string | undefined = config.hero_images?.[0] || config.noiva_foto_url || config.noivo_foto_url || undefined;
  // Sempre que temos os dois nomes, geramos o cartão (com ou sem foto —
  // o gerador tem um fundo elegante de fallback); só cai pra "sem
  // imagem nenhuma" no caso raro de faltar algum dos nomes.
  const image = noiva && noivo ? buildConviteCardImageUrl({ noiva, noivo, data: dataFormatada, foto: rawImage }) : undefined;

  const url = `${getBaseUrl()}${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      type: 'website',
      locale: 'pt_BR',
      images: image ? [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/** Metadata do convite individual (`/inv/[slug]`). */
export async function buildInviteMetadataBySlug(slug: string): Promise<Metadata> {
  if (!slug || slug === 'preview') return FALLBACK_METADATA;
  try {
    const supabase = getPublicSupabaseClient();
    const { data: invite } = await supabase.from('convites').select('evento_id').eq('slug', slug).maybeSingle();
    if (!invite?.evento_id) return FALLBACK_METADATA;

    const { data: config } = await supabase
      .from('configuracoes')
      .select('noiva_nome, noivo_nome, data_casamento, hero_images, noiva_foto_url, noivo_foto_url')
      .eq('evento_id', invite.evento_id)
      .maybeSingle();
    if (!config) return FALLBACK_METADATA;

    return buildMetadataFromConfig(config, `/inv/${slug}`);
  } catch (err) {
    console.error('[inviteMetadata] Erro ao gerar metadata do convite:', err);
    return FALLBACK_METADATA;
  }
}

/** Metadata do convite por Link Único (`/inv/evento/[eventoSlug]`). */
export async function buildInviteMetadataByEventoSlug(eventoSlug: string): Promise<Metadata> {
  if (!eventoSlug) return FALLBACK_METADATA;
  try {
    const supabase = getPublicSupabaseClient();
    const { data: evento } = await supabase
      .from('eventos')
      .select('id')
      .eq('slug', eventoSlug)
      .is('deleted_at', null)
      .maybeSingle();
    if (!evento?.id) return FALLBACK_METADATA;

    const { data: config } = await supabase
      .from('configuracoes')
      .select('noiva_nome, noivo_nome, data_casamento, hero_images, noiva_foto_url, noivo_foto_url')
      .eq('evento_id', evento.id)
      .maybeSingle();
    if (!config) return FALLBACK_METADATA;

    return buildMetadataFromConfig(config, `/inv/evento/${eventoSlug}`);
  } catch (err) {
    console.error('[inviteMetadata] Erro ao gerar metadata do convite (link único):', err);
    return FALLBACK_METADATA;
  }
}
