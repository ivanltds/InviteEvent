import { buildInviteMetadataBySlug, buildInviteMetadataByEventoSlug } from '../inviteMetadata';

/**
 * Pedido do usuário em 20/09/2026 (com print do card genérico do
 * InviteEventAI aparecendo no WhatsApp em vez do card do casal): cada
 * convite deve gerar seu próprio Open Graph (nome do casal, data e foto),
 * tanto no fluxo tradicional (`/inv/[slug]`) quanto no Link Único
 * (`/inv/evento/[eventoSlug]`).
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

describe('buildInviteMetadataBySlug', () => {
  beforeEach(() => {
    fromMock = jest.fn();
  });

  it('gera título, descrição e imagem a partir do convite e da config do evento', async () => {
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
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/foto-casal.jpg', width: 1200, height: 630, alt: 'Ana & Carlos' },
    ]);
    expect((metadata.twitter as any)?.card).toBe('summary_large_image');
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
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/ana.jpg', width: 1200, height: 630, alt: 'Ana & Carlos' },
    ]);
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
  });

  it('usa o fallback quando o evento não existe', async () => {
    fromMock.mockImplementation(() => makeChain(null));
    const metadata = await buildInviteMetadataByEventoSlug('evento-inexistente');
    expect(metadata.title).toBe('InviteEventAI');
  });
});
