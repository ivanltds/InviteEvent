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

/**
 * Carrega a fonte de um arquivo estático em public/fonts/ em vez de
 * buscar do Google Fonts a cada requisição. O Google não serve mais
 * TTF/OTF de forma confiável via truque de User-Agent (só WOFF2/WOFF,
 * que o Satori — motor do ImageResponse — não lê), então empacotamos o
 * arquivo (fonte variável, funciona pra qualquer peso) direto no
 * projeto. Buscar via fetch relativo à própria requisição (em vez de
 * fs.readFile) é o padrão recomendado pra assets estáticos em rotas
 * como esta na Vercel.
 */
async function loadLocalFont(request: Request, path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(new URL(path, request.url));
    if (!res.ok) return null;
    return await res.arrayBuffer();
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

  const playfairBold = await loadLocalFont(request, '/fonts/PlayfairDisplay-Variable.ttf');

  try {
  const imageResponse = new ImageResponse(
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

        {/* Faixa sólida (não só gradiente) na parte de baixo — garante
            leitura do texto mesmo sobre fotos claras/movimentadas, o que
            um degradê suave sozinho não garantia (testado ao vivo: a
            data ficava quase invisível sobre uma foto clara). Um
            gradiente fino faz a transição entre a foto e a faixa. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '46%',
            display: 'flex',
            background: 'linear-gradient(to top, rgba(15,12,8,0.94) 55%, rgba(15,12,8,0) 100%)',
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
            padding: '0 70px 56px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: playfairBold ? 'Playfair Display' : 'serif',
              fontWeight: 700,
              fontSize: noiva.length + noivo.length > 26 ? 58 : 72,
              color: '#FFFFFF',
              letterSpacing: 0.5,
              lineHeight: 1.2,
            }}
          >
            {noiva} &amp; {noivo}
          </div>
          {data && (
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontFamily: playfairBold ? 'Playfair Display' : 'serif',
                fontWeight: 700,
                fontSize: 26,
                color: '#D9B978',
                letterSpacing: 4,
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
    // ImageResponse devolve um Response cujo corpo (o encode real da
    // imagem) só roda quando o stream é lido — um catch em volta só do
    // `new ImageResponse(...)` não pega erros daí. Forçamos a leitura
    // completa aqui dentro do try pra qualquer erro de renderização
    // aparecer no catch abaixo, em vez de virar um 500 genérico do
    // Next sem detalhe nenhum.
    const buffer = await imageResponse.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, immutable, no-transform, max-age=86400',
      },
    });
  } catch (err: any) {
    // DEBUG TEMPORÁRIO (20/09/2026): rota retornando 500 em produção sem
    // mensagem visível nos logs — expõe o erro real pra diagnosticar,
    // remover assim que identificado.
    console.error('[og/convite] Erro ao gerar imagem:', err);
    return new Response(`DEBUG ERROR: ${err?.message || String(err)}\n\n${err?.stack || ''}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
