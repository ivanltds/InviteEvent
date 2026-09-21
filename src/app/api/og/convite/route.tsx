import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Gera dinamicamente o cartão de preview do convite (nomes do casal em
 * tipografia elegante sobre a foto, com a data) — usado como og:image em
 * cada convite. Pedido do usuário em 20/09/2026, com imagens de
 * referência de cartões de casamento tradicionais. Cada design aqui é
 * original, inspirado apenas na composição geral do gênero (foto + nomes
 * + data) — não reproduz nenhum template específico das referências
 * (produtos de terceiros com marca d'água).
 *
 * Pedido de acompanhamento: pelo menos 5 modelos diferentes, escolhidos
 * pelos noivos em Configurações (config.card_template).
 *
 * Recebe os dados já prontos via querystring (noiva, noivo, data, foto,
 * template, cor) em vez de consultar o banco aqui — quem monta a URL é
 * src/lib/metadata/inviteMetadata.ts / src/lib/utils/conviteCard.ts.
 */

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

export const CARD_TEMPLATES = ['classico', 'circular', 'retrato', 'minimalista', 'romantico', 'colorido'] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

function isCardTemplate(value: string | null): value is CardTemplate {
  return !!value && (CARD_TEMPLATES as readonly string[]).includes(value);
}

/**
 * Fontes estáticas em public/fonts/ — o Google Fonts não serve mais
 * TTF/OTF de forma confiável (só WOFF2/WOFF, que o Satori não lê), e
 * fontes VARIÁVEIS quebram o parser interno do Satori (@vercel/og)
 * ("Cannot read properties of undefined (reading '256')" em
 * parseFvarAxis) — por isso cada arquivo aqui é uma fonte estática de
 * peso/estilo fixo, resgatada do histórico do próprio repositório do
 * Google Fonts. Lidas do disco (não via fetch) e cacheadas em memória do
 * processo — só a primeira requisição de cada instância "fria" paga
 * esse custo (ver histórico: fetch pra própria rota deixava a geração
 * lenta o bastante pra arriscar estourar o timeout do crawler do
 * WhatsApp).
 */
const FONT_FILES = {
  playfairBold: 'PlayfairDisplay-Bold.ttf',
  playfairRegular: 'PlayfairDisplay-Regular.ttf',
  playfairItalic: 'PlayfairDisplay-Italic.ttf',
  pinyonScript: 'PinyonScript-Regular.ttf',
} as const;

type LoadedFonts = Record<keyof typeof FONT_FILES, ArrayBuffer | null>;

let cachedFonts: LoadedFonts | null = null;

async function loadFonts(): Promise<LoadedFonts> {
  if (cachedFonts) return cachedFonts;

  const entries = await Promise.all(
    (Object.entries(FONT_FILES) as [keyof typeof FONT_FILES, string][]).map(async ([key, filename]) => {
      try {
        const buffer = await readFile(join(process.cwd(), 'public', 'fonts', filename));
        return [key, buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer] as const;
      } catch {
        return [key, null] as const;
      }
    })
  );

  cachedFonts = Object.fromEntries(entries) as LoadedFonts;
  return cachedFonts;
}

function buildFontsOption(fonts: LoadedFonts) {
  const list: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' | 'italic' }[] = [];
  if (fonts.playfairBold) list.push({ name: 'Playfair Display', data: fonts.playfairBold, weight: 700, style: 'normal' });
  if (fonts.playfairRegular) list.push({ name: 'Playfair Display', data: fonts.playfairRegular, weight: 400, style: 'normal' });
  if (fonts.playfairItalic) list.push({ name: 'Playfair Display Italic', data: fonts.playfairItalic, weight: 400, style: 'italic' });
  if (fonts.pinyonScript) list.push({ name: 'Pinyon Script', data: fonts.pinyonScript, weight: 400, style: 'normal' });
  return list.length > 0 ? list : undefined;
}

interface CardData {
  noiva: string;
  noivo: string;
  data: string;
  foto: string;
  accentColor: string;
  hasPlayfair: boolean;
  hasScript: boolean;
}

const serifBold = (hasPlayfair: boolean) => (hasPlayfair ? 'Playfair Display' : 'serif');
const serifRegular = (hasPlayfair: boolean) => (hasPlayfair ? 'Playfair Display' : 'serif');
const serifItalic = (hasPlayfair: boolean) => (hasPlayfair ? 'Playfair Display Italic' : 'serif');
const script = (hasScript: boolean, hasPlayfair: boolean) => (hasScript ? 'Pinyon Script' : serifItalic(hasPlayfair));

/** 1) Clássico — foto de fundo, faixa escura sólida embaixo, nomes grandes em negrito. */
function CardClassico({ noiva, noivo, data, foto, hasPlayfair }: CardData) {
  const namesLong = noiva.length + noivo.length > 26;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#2b2620' }}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%', display: 'flex',
          background: 'linear-gradient(to top, rgba(15,12,8,0.94) 55%, rgba(15,12,8,0) 100%)',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: '100%', height: '100%', padding: '0 70px 56px', textAlign: 'center' }}>
        <div style={{ display: 'flex', fontFamily: serifBold(hasPlayfair), fontWeight: 700, fontSize: namesLong ? 58 : 72, color: '#FFFFFF', letterSpacing: 0.5, lineHeight: 1.2 }}>
          {noiva} &amp; {noivo}
        </div>
        {data && (
          <div style={{ display: 'flex', marginTop: 18, fontFamily: serifBold(hasPlayfair), fontWeight: 700, fontSize: 26, color: '#D9B978', letterSpacing: 4, textTransform: 'uppercase' }}>
            {data}
          </div>
        )}
      </div>
    </div>
  );
}

/** 2) Circular — fundo cor sólida, foto redonda emoldurada, nomes em script. */
function CardCircular({ noiva, noivo, data, foto, accentColor, hasPlayfair, hasScript }: CardData) {
  const nameFits = noiva.length + noivo.length <= 22;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F6EFE4', padding: '48px 60px', position: 'relative' }}>
      <div style={{ display: 'flex', fontFamily: serifRegular(hasPlayfair), fontSize: 20, letterSpacing: 3, textTransform: 'uppercase', color: '#8a7256', marginTop: 6 }}>
        Você está convidado para o casamento de
      </div>
      {foto ? (
        <div style={{ display: 'flex', width: 300, height: 300, borderRadius: '50%', border: `10px solid ${accentColor}`, marginTop: 26, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="" width={300} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', width: 300, height: 300, borderRadius: '50%', border: `10px solid ${accentColor}`, marginTop: 26, backgroundColor: '#EFE4D2' }} />
      )}
      <div
        style={{
          display: 'flex', marginTop: 30, fontFamily: script(hasScript, hasPlayfair), fontSize: nameFits ? 96 : 68, color: '#5c4630', lineHeight: 1,
        }}
      >
        {noiva} &amp; {noivo}
      </div>
      {data && (
        <div style={{ display: 'flex', marginTop: 18, fontFamily: serifRegular(hasPlayfair), fontSize: 26, letterSpacing: 2, color: '#8a7256' }}>
          {data}
        </div>
      )}
    </div>
  );
}

/** 3) Retrato — cabeçalho, foto em faixa horizontal ao centro, nomes com "&" em script colorido. */
function CardRetrato({ noiva, noivo, data, foto, accentColor, hasPlayfair, hasScript }: CardData) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 40px 18px', textAlign: 'center' }}>
        <div style={{ display: 'flex', fontFamily: serifRegular(hasPlayfair), fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', color: '#8a8a8a' }}>
          Convidamos você para
        </div>
        <div style={{ display: 'flex', fontFamily: script(hasScript, hasPlayfair), fontSize: 40, color: '#2b2b2b', marginTop: 4 }}>
          O Casamento de
        </div>
      </div>
      <div style={{ display: 'flex', width: '100%', height: 300, position: 'relative', backgroundColor: '#e8e8e8' }}>
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" width={WIDTH} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: serifBold(hasPlayfair), fontWeight: 700, fontSize: 54, color: '#2b2b2b' }}>
          <span>{noiva}</span>
          <span style={{ display: 'flex', fontFamily: script(hasScript, hasPlayfair), color: accentColor, fontSize: 60, margin: '0 18px' }}>&amp;</span>
          <span>{noivo}</span>
        </div>
        {data && (
          <div style={{ display: 'flex', marginTop: 12, fontFamily: serifRegular(hasPlayfair), fontSize: 24, color: accentColor, fontWeight: 700 }}>
            {data}
          </div>
        )}
      </div>
    </div>
  );
}

/** 4) Minimalista — tipografia pura, sem foto, muito espaço em branco. */
function CardMinimalista({ noiva, noivo, data, accentColor, hasPlayfair }: CardData) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2', padding: '0 90px', textAlign: 'center' }}>
      <div style={{ display: 'flex', fontFamily: serifRegular(hasPlayfair), fontSize: 16, letterSpacing: 6, textTransform: 'uppercase', color: '#9a9284' }}>
        Save the date
      </div>
      <div style={{ display: 'flex', width: 90, height: 1, backgroundColor: accentColor, marginTop: 26 }} />
      <div style={{ display: 'flex', marginTop: 26, fontFamily: serifRegular(hasPlayfair), fontWeight: 400, fontSize: 68, color: '#2b2620', letterSpacing: 1 }}>
        {noiva} &amp; {noivo}
      </div>
      <div style={{ display: 'flex', width: 90, height: 1, backgroundColor: accentColor, marginTop: 26 }} />
      {data && (
        <div style={{ display: 'flex', marginTop: 26, fontFamily: serifRegular(hasPlayfair), fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#6b6255' }}>
          {data}
        </div>
      )}
    </div>
  );
}

/** 5) Romântico — foto com vinheta escura por inteiro, nomes centralizados em itálico. */
function CardRomantico({ noiva, noivo, data, foto, hasPlayfair }: CardData) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#1a1512' }}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundColor: 'rgba(15,10,8,0.6)' }} />
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', textAlign: 'center', padding: '0 80px' }}>
        <div style={{ display: 'flex', fontFamily: serifItalic(hasPlayfair), fontStyle: 'italic', fontSize: 66, color: '#FFFFFF', letterSpacing: 3 }}>
          {noiva} &amp; {noivo}
        </div>
        {data && (
          <div style={{ display: 'flex', marginTop: 22, fontFamily: serifRegular(hasPlayfair), fontSize: 22, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
            {data}
          </div>
        )}
      </div>
    </div>
  );
}

/** 6) Colorido — foto com tingimento na cor do tema do evento, nome alinhado à esquerda embaixo. */
function CardColorido({ noiva, noivo, data, foto, accentColor, hasPlayfair }: CardData) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: accentColor }}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundColor: accentColor, opacity: 0.42 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, display: 'flex', backgroundColor: accentColor }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', padding: '0 64px 54px' }}>
        {data && (
          <div
            style={{
              display: 'flex', alignSelf: 'flex-start', fontFamily: serifRegular(hasPlayfair), fontSize: 20, letterSpacing: 3, textTransform: 'uppercase',
              color: '#FFFFFF', backgroundColor: accentColor, padding: '8px 20px', borderRadius: 30, marginBottom: 22,
            }}
          >
            {data}
          </div>
        )}
        <div style={{ display: 'flex', fontFamily: serifBold(hasPlayfair), fontWeight: 700, fontSize: 66, color: '#FFFFFF', lineHeight: 1.15 }}>
          {noiva} &amp; {noivo}
        </div>
      </div>
    </div>
  );
}

function renderCard(template: CardTemplate, ctx: CardData) {
  switch (template) {
    case 'circular': return <CardCircular {...ctx} />;
    case 'retrato': return <CardRetrato {...ctx} />;
    case 'minimalista': return <CardMinimalista {...ctx} />;
    case 'romantico': return <CardRomantico {...ctx} />;
    case 'colorido': return <CardColorido {...ctx} />;
    case 'classico':
    default:
      return <CardClassico {...ctx} />;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noiva = (searchParams.get('noiva') || 'Noiva').slice(0, 60);
  const noivo = (searchParams.get('noivo') || 'Noivo').slice(0, 60);
  const data = (searchParams.get('data') || '').slice(0, 60);
  const foto = searchParams.get('foto') || '';
  const accentColor = searchParams.get('cor') || '#8a6d3b';
  const templateParam = searchParams.get('template');
  const template: CardTemplate = isCardTemplate(templateParam) ? templateParam : 'classico';

  const fonts = await loadFonts();
  const hasPlayfair = !!(fonts.playfairBold || fonts.playfairRegular || fonts.playfairItalic);
  const hasScript = !!fonts.pinyonScript;

  try {
    const imageResponse = new ImageResponse(
      renderCard(template, { noiva, noivo, data, foto, accentColor, hasPlayfair, hasScript }),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: buildFontsOption(fonts),
      }
    );

    // O corpo do ImageResponse (o encode real da imagem) só roda quando
    // o stream é lido — força a leitura completa aqui pra qualquer erro
    // de renderização virar uma exceção capturável abaixo, em vez de um
    // 500 genérico do Next sem detalhe nenhum.
    const buffer = await imageResponse.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, immutable, no-transform, max-age=86400',
      },
    });
  } catch (err) {
    console.error('[og/convite] Erro ao gerar o cartão:', err);
    // Sem cartão nenhum é melhor que quebrar o carregamento do <head>
    // do convite — WhatsApp/Facebook simplesmente mostram o preview sem
    // imagem quando o og:image falha.
    return new Response('Erro ao gerar o cartão do convite.', { status: 500 });
  }
}
