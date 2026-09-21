import { buildConviteCardImageUrl, CARD_TEMPLATES, CARD_TEMPLATE_LABELS } from '../conviteCard';

/**
 * Pedido do usuário em 21/09/2026: pelo menos 5 modelos de cartão
 * selecionáveis em Configurações. `buildConviteCardImageUrl` é o ponto
 * único que monta a URL do gerador (/api/og/convite) tanto pro
 * og:image (inviteMetadata.ts) quanto pro Web Share (admin/convidados).
 */

describe('CARD_TEMPLATES', () => {
  it('tem pelo menos 5 modelos, cada um com um rótulo em português', () => {
    expect(CARD_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    CARD_TEMPLATES.forEach(template => {
      expect(CARD_TEMPLATE_LABELS[template]).toEqual(expect.any(String));
      expect(CARD_TEMPLATE_LABELS[template].length).toBeGreaterThan(0);
    });
  });

  it('inclui o modelo clássico (default histórico)', () => {
    expect(CARD_TEMPLATES).toContain('classico');
  });
});

describe('buildConviteCardImageUrl', () => {
  const baseUrl = 'https://invite-event-beryl.vercel.app';

  it('monta a URL básica só com os nomes, sem template/cor quando não informados', () => {
    const url = buildConviteCardImageUrl({ noiva: 'Ana', noivo: 'Carlos' }, baseUrl);
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(`${baseUrl}/api/og/convite`);
    expect(parsed.searchParams.get('noiva')).toBe('Ana');
    expect(parsed.searchParams.get('noivo')).toBe('Carlos');
    expect(parsed.searchParams.has('template')).toBe(false);
    expect(parsed.searchParams.has('cor')).toBe(false);
  });

  it('repassa template e accentColor como query params (template/cor)', () => {
    const url = buildConviteCardImageUrl(
      { noiva: 'Ana', noivo: 'Carlos', template: 'circular', accentColor: '#123456' },
      baseUrl
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('template')).toBe('circular');
    expect(parsed.searchParams.get('cor')).toBe('#123456');
  });

  it('repassa data e foto quando informados', () => {
    const url = buildConviteCardImageUrl(
      { noiva: 'Ana', noivo: 'Carlos', data: '10 de outubro de 2026', foto: 'https://cdn.example.com/foto.jpg' },
      baseUrl
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('data')).toBe('10 de outubro de 2026');
    expect(parsed.searchParams.get('foto')).toBe('https://cdn.example.com/foto.jpg');
  });

  // Pedido do usuário em 21/09/2026: escolher a fonte do nome, o
  // tamanho dela, o tamanho da data e o zoom da foto, independente para
  // cada modelo.
  it('repassa font, fontScale, dateFontScale e imageScale como query params (fonte/escala/escalaData/zoom)', () => {
    const url = buildConviteCardImageUrl(
      { noiva: 'Ana', noivo: 'Carlos', font: 'Great+Vibes', fontScale: 120, dateFontScale: 80, imageScale: 150 },
      baseUrl
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('fonte')).toBe('Great+Vibes');
    expect(parsed.searchParams.get('escala')).toBe('120');
    expect(parsed.searchParams.get('escalaData')).toBe('80');
    expect(parsed.searchParams.get('zoom')).toBe('150');
  });

  it('não inclui fonte/escala/escalaData/zoom na URL quando não informados', () => {
    const url = buildConviteCardImageUrl({ noiva: 'Ana', noivo: 'Carlos' }, baseUrl);
    const parsed = new URL(url);

    expect(parsed.searchParams.has('fonte')).toBe(false);
    expect(parsed.searchParams.has('escala')).toBe(false);
    expect(parsed.searchParams.has('escalaData')).toBe(false);
    expect(parsed.searchParams.has('zoom')).toBe(false);
  });
});
