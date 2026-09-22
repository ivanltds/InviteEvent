import { buildInviteMetadataBySlug, buildInviteMetadataByEventoSlug } from '../inviteMetadata';

/**
 * Pedido do usuário em 20/09/2026 (com print do card genérico do
 * Celebraê aparecendo no WhatsApp em vez do card do casal, e depois
 * uma imagem de referência de um cartão de convite tradicional): cada
 * convite deve gerar seu próprio Open Graph, com um CARTÃO (nomes do
 * casal em tipografia elegante sobre a foto + data), não a foto crua —
 * gerado dinamicamente em /api/og/convite (ver route.tsx nessa pasta).
 */

const makeChain = (data: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
});

let fromMock: jest.Mock;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => fromMock(...args),
  })),
}));

/** Extrai {noiva, noivo, data, foto, template, cor, fonte, escala, zoom} da URL do gerador de cartão, sem depender da ordem dos parâmetros. */
function parseCardImageUrl(url: string) {
  const parsed = new URL(url);
  return {
    pathname: parsed.pathname,
    noiva: parsed.searchParams.get('noiva'),
    noivo: parsed.searchParams.get('noivo'),
    data: parsed.searchParams.get('data'),
    foto: parsed.searchParams.get('foto'),
    template: parsed.searchParams.get('template'),
    cor: parsed.searchParams.get('cor'),
    fonte: parsed.searchParams.get('fonte'),
    escala: parsed.searchParams.get('escala'),
    escalaData: parsed.searchParams.get('escalaData'),
    zoom: parsed.searchParams.get('zoom'),
  };
}

describe('buildInviteMetadataBySlug', () => {
  beforeEach(() => {
    fromMock = jest.fn();
  });

  it('gera título e descrição a partir do convite e da config do evento', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: ['https://cdn.example.com/foto-casal.jpg'],
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');

    expect(metadata.title).toBe('Ana & Carlos');
    expect(metadata.description).toContain('Ana & Carlos');
    expect(metadata.description).toContain('outubro de 2026');
    expect((metadata.twitter as any)?.card).toBe('summary_large_image');
  });

  it('og:image aponta pro gerador de cartão (/api/og/convite) com nomes, data e foto', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Andréia',
          noivo_nome: 'Thiago',
          data_casamento: '2026-11-14',
          hero_images: ['https://res.cloudinary.com/dqt35bpzt/image/upload/v1789848523/foto.jpg'],
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('andreia-thiago-a1b2');
    const images = metadata.openGraph?.images as any[];

    expect(images).toHaveLength(1);
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
    expect(images[0].alt).toBe('Andréia & Thiago');

    const parsed = parseCardImageUrl(images[0].url);
    expect(parsed.pathname).toBe('/api/og/convite');
    expect(parsed.noiva).toBe('Andréia');
    expect(parsed.noivo).toBe('Thiago');
    expect(parsed.data).toContain('novembro de 2026');
    expect(parsed.foto).toBe('https://res.cloudinary.com/dqt35bpzt/image/upload/v1789848523/foto.jpg');
  });

  it('gera o cartão mesmo sem foto cadastrada (o gerador tem um fundo de fallback)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: [],
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];

    expect(images).toHaveLength(1);
    const parsed = parseCardImageUrl(images[0].url);
    expect(parsed.noiva).toBe('Ana');
    expect(parsed.foto).toBeNull();
  });

  it('cai para as fotos individuais quando não há hero_images', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: [],
          noiva_foto_url: 'https://cdn.example.com/ana.jpg',
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];
    expect(parseCardImageUrl(images[0].url).foto).toBe('https://cdn.example.com/ana.jpg');
  });

  it('repassa card_template e accent_color escolhidos em Configurações pra URL do cartão', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: ['https://cdn.example.com/foto.jpg'],
          card_template: 'circular',
          accent_color: '#123456',
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];
    const parsed = parseCardImageUrl(images[0].url);
    expect(parsed.template).toBe('circular');
    expect(parsed.cor).toBe('#123456');
  });

  // Pedido do usuário em 21/09/2026: fonte, tamanho da fonte e foto/zoom
  // independentes para cada um dos 6 modelos (card_template_styles).
  it('repassa a personalização (fonte/escala/zoom/foto) do modelo ativo, de card_template_styles', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: ['https://cdn.example.com/automatica.jpg'],
          card_template: 'circular',
          card_template_styles: {
            circular: { font: 'Great+Vibes', fontScale: 120, dateFontScale: 90, image: 'https://cdn.example.com/escolhida.jpg', imageScale: 150 },
            classico: { font: 'Sacramento', fontScale: 80 },
          },
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];
    const parsed = parseCardImageUrl(images[0].url);

    expect(parsed.template).toBe('circular');
    expect(parsed.fonte).toBe('Great+Vibes');
    expect(parsed.escala).toBe('120');
    expect(parsed.escalaData).toBe('90');
    expect(parsed.zoom).toBe('150');
    // A foto escolhida especificamente pro modelo ativo tem prioridade sobre o fallback automático (hero_images[0]).
    expect(parsed.foto).toBe('https://cdn.example.com/escolhida.jpg');
  });

  it('cai pro fallback automático de foto quando o modelo ativo não tem imagem escolhida', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: ['https://cdn.example.com/automatica.jpg'],
          card_template: 'classico',
          card_template_styles: { classico: { font: 'Sacramento' } },
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];
    const parsed = parseCardImageUrl(images[0].url);

    expect(parsed.fonte).toBe('Sacramento');
    expect(parsed.foto).toBe('https://cdn.example.com/automatica.jpg');
  });

  it('funciona normalmente sem card_template_styles cadastrado (config antiga)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'convites') return makeChain({ evento_id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Ana',
          noivo_nome: 'Carlos',
          data_casamento: '2026-10-10',
          hero_images: ['https://cdn.example.com/foto.jpg'],
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    const images = metadata.openGraph?.images as any[];
    const parsed = parseCardImageUrl(images[0].url);

    expect(parsed.fonte).toBeNull();
    expect(parsed.escala).toBeNull();
    expect(parsed.zoom).toBeNull();
    expect(parsed.foto).toBe('https://cdn.example.com/foto.jpg');
  });

  it('usa o fallback genérico do app quando o convite não existe', async () => {
    fromMock.mockImplementation(() => makeChain(null));

    const metadata = await buildInviteMetadataBySlug('slug-inexistente');
    expect(metadata.title).toBe('Celebraê');
    expect(metadata.openGraph).toBeUndefined();
  });

  it('usa o fallback genérico para o slug especial "preview", sem ir ao banco', async () => {
    const metadata = await buildInviteMetadataBySlug('preview');
    expect(metadata.title).toBe('Celebraê');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('cai pro fallback sem lançar erro se a consulta falhar', async () => {
    fromMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    expect(metadata.title).toBe('Celebraê');
  });
});

describe('buildInviteMetadataByEventoSlug', () => {
  beforeEach(() => {
    fromMock = jest.fn();
  });

  it('gera metadata a partir do evento (modo Link Único)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'eventos') return makeChain({ id: 'e1' });
      if (table === 'configuracoes')
        return makeChain({
          noiva_nome: 'Andréia',
          noivo_nome: 'Thiago',
          data_casamento: '2026-11-01',
          hero_images: ['https://cdn.example.com/casal.jpg'],
        });
      return makeChain(null);
    });

    const metadata = await buildInviteMetadataByEventoSlug('casamento-de-andreia-e-thiago');
    expect(metadata.title).toBe('Andréia & Thiago');
    expect(metadata.openGraph?.url).toContain('/inv/evento/casamento-de-andreia-e-thiago');

    const images = metadata.openGraph?.images as any[];
    expect(parseCardImageUrl(images[0].url).foto).toBe('https://cdn.example.com/casal.jpg');
  });

  it('usa o fallback quando o evento não existe', async () => {
    fromMock.mockImplementation(() => makeChain(null));
    const metadata = await buildInviteMetadataByEventoSlug('evento-inexistente');
    expect(metadata.title).toBe('Celebraê');
  });
});
