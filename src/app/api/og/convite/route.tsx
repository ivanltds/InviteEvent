import { ImageResponse } from 'next/og';

/**
 * Gera dinamicamente o cartão de preview do convite (nomes do casal em
 * tipografia serifada elegante sobre a foto, com a data) — usado como
 * og:image em cada convite. Pedido do usuário em 20/09/2026, com uma
 * imagem de referência de um cartão de casamento tradicional (foto +
 * nomes grandes serifados + data). Este design é original, inspirado
 * apenas na composição geral (foto de fundo + nomes + data) — não
 * reproduz o template específico da referência (produto de terceiros
 * com marca d'água).
 *
 * Recebe os dados já prontos via querystring (noiva, noivo, data, foto)
 * em vez de consultar o banco aqui — quem monta a URL é
 * src/lib/metadata/inviteMetadata.ts, que já faz essa consulta uma
 * única vez para o restante do <head> (title/description).
 */

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

// Google Fonts serve WOFF2 por padrão, que o Satori (motor do
// ImageResponse) não consegue ler — precisa de TTF/OTF. Forçar um
// User-Agent antigo faz o Google servir o formato compatível.
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const css = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
      },
    }).then((res) => res.text());

    const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;

    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noiva = (searchParams.get('noiva') || 'Noiva').slice(0, 60);
  const noivo = (searchParams.get('noivo') || 'Noivo').slice(0, 60);
  const data = (searchParams.get('data') || '').slice(0, 60);
  const foto = searchParams.get('foto') || '';

  const playfairBold = await loadGoogleFont('Playfair Display', 700);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#2b2620',
        }}
      >
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Gradiente escuro de baixo pra cima — garante leitura do texto
            independente do quão clara/escura a foto seja. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(to top, rgba(20,16,10,0.88) 0%, rgba(20,16,10,0.35) 45%, rgba(20,16,10,0.15) 65%, rgba(20,16,10,0.35) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            padding: '64px 80px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: playfairBold ? 'Playfair Display' : 'serif',
              fontWeight: 700,
              fontSize: noiva.length + noivo.length > 30 ? 64 : 84,
              color: '#FBF8F2',
              letterSpacing: 1,
              lineHeight: 1.15,
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            {noiva} &amp; {noivo}
          </div>
          {data && (
            <div
              style={{
                display: 'flex',
                marginTop: 20,
                fontFamily: playfairBold ? 'Playfair Display' : 'serif',
                fontSize: 30,
                color: '#E8DCC0',
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              {data}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=86400',
      },
      fonts: playfairBold
        ? [{ name: 'Playfair Display', data: playfairBold, weight: 700, style: 'normal' }]
        : undefined,
    }
  );
}
