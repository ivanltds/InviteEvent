import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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
 * buscar do Google Fonts a cada requisição — o Google não serve mais
 * TTF/OTF de forma confiável via truque de User-Agent (só WOFF2/WOFF,
 * que o Satori — motor do ImageResponse — não lê). O arquivo precisa
 * ser uma fonte ESTÁTICA (peso fixo), não variável: o parser de fonte
 * interno do Satori (@vercel/og) quebra ao ler a tabela `fvar` de
 * fontes variáveis (confirmado ao vivo: "Cannot read properties of
 * undefined (reading '256')" em parseFvarAxis).
 *
 * Correção de 20/09/2026: lia a fonte via `fetch` pra própria rota (um
 * round-trip HTTP inteiro a cada requisição), o que deixava a geração
 * do cartão lenta o bastante (~2.6s) pra arriscar estourar o timeout do
 * crawler do WhatsApp — o preview simplesmente não carregava a imagem.
 * Lendo direto do disco (fs) é bem mais rápido, e o resultado fica em
 * cache num módulo (memória do processo), então só a PRIMEIRA
 * requisição de cada instância "fria" da function paga esse custo.
 */
let cachedFont: ArrayBuffer | null | undefined;

async function loadLocalFont(): Promise<ArrayBuffer | null> {
  if (cachedFont !== undefined) return cachedFont;
  try {
    const buffer = await readFile(join(process.cwd(), 'public', 'fonts', 'PlayfairDisplay-Bold.ttf'));
    cachedFont = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch {
    cachedFont = null;
  }
  return cachedFont;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noiva = (searchParams.get('noiva') || 'Noiva').slice(0, 60);
  const noivo = (searchParams.get('noivo') || 'Noivo').slice(0, 60);
  const data = (searchParams.get('data') || '').slice(0, 60);
  const foto = searchParams.get('foto') || '';

  const playfairBold = await loadLocalFont();

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
              leitura do texto mesmo sobre fotos claras/movimentadas, o
              que um degradê suave sozinho não garantia. Um gradiente
              fino faz a transição entre a foto e a faixa. */}
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
        fonts: playfairBold
          ? [{ name: 'Playfair Display', data: playfairBold, weight: 700, style: 'normal' }]
          : undefined,
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
