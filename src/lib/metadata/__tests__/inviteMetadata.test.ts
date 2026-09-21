import { buildInviteMetadataBySlug, buildInviteMetadataByEventoSlug } from '../inviteMetadata';

/**
 * Pedido do usuário em 20/09/2026 (com print do card genérico do
 * InviteEventAI aparecendo no WhatsApp em vez do card do casal, e depois
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

/** Extrai {noiva, noivo, data, foto} da URL do gerador de cartão, sem depender da ordem dos parâmetros. */
function parseCardImageUrl(url: string) {
  const parsed = new URL(url);
  return {
    pathname: parsed.pathname,
    noiva: parsed.searchParams.get('noiva'),
    noivo: parsed.searchParams.get('noivo'),
    data: parsed.searchParams.get('data'),
    foto: parsed.searchParams.get('foto'),
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

  it('usa o fallback genérico do app quando o convite não existe', async () => {
    fromMock.mockImplementation(() => makeChain(null));

    const metadata = await buildInviteMetadataBySlug('slug-inexistente');
    expect(metadata.title).toBe('InviteEventAI');
    expect(metadata.openGraph).toBeUndefined();
  });

  it('usa o fallback genérico para o slug especial "preview", sem ir ao banco', async () => {
    const metadata = await buildInviteMetadataBySlug('preview');
    expect(metadata.title).toBe('InviteEventAI');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('cai pro fallback sem lançar erro se a consulta falhar', async () => {
    fromMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const metadata = await buildInviteMetadataBySlug('ana-carlos-a1b2');
    expect(metadata.title).toBe('InviteEventAI');
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
    expect(metadata.title).toBe('InviteEventAI');
  });
});
