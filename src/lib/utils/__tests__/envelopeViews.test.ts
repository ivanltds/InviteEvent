import { hasExceededViewLimit, incrementViewCount } from '../envelopeViews';

describe('envelopeViews', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasExceededViewLimit', () => {
    it('não excedeu na primeira visita (sem contagem salva)', () => {
      expect(hasExceededViewLimit('evento-a', false)).toBe(false);
    });

    it('excede depois de 3 visualizações', () => {
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      expect(hasExceededViewLimit('evento-a', false)).toBe(true);
    });

    it('não excede antes de bater o limite (2 visualizações)', () => {
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      expect(hasExceededViewLimit('evento-a', false)).toBe(false);
    });

    it('força a exibição quando forcePreview é true, mesmo excedido', () => {
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      expect(hasExceededViewLimit('evento-a', true)).toBe(false);
    });

    it('força a exibição para a key especial "preview"', () => {
      incrementViewCount('preview');
      incrementViewCount('preview');
      incrementViewCount('preview');
      expect(hasExceededViewLimit('preview', false)).toBe(false);
    });

    it('contagens de chaves diferentes não se misturam', () => {
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      incrementViewCount('evento-a');
      expect(hasExceededViewLimit('evento-b', false)).toBe(false);
    });
  });
});
