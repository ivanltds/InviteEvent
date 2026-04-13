/**
 * STORY-057 TDD: Font constants validation
 * Tests written FIRST — validates font catalog structure before implementation.
 */
import { CURSIVE_FONTS, SERIF_FONTS, getFontUrl } from '../constants/fonts';

describe('STORY-057: fonts.ts constants', () => {
  describe('CURSIVE_FONTS catalog', () => {
    test('deve ter ao menos 10 fontes cursivas', () => {
      expect(CURSIVE_FONTS.length).toBeGreaterThanOrEqual(10);
    });

    test('cada fonte deve ter name, googleFamily e category', () => {
      CURSIVE_FONTS.forEach(font => {
        expect(font.name).toBeTruthy();
        expect(font.googleFamily).toBeTruthy();
        expect(['dramatic', 'ultra-dramatic', 'moderate', 'vintage']).toContain(font.category);
      });
    });

    test('deve incluir fontes dramáticas (Pinyon Script e Great Vibes)', () => {
      const names = CURSIVE_FONTS.map(f => f.name);
      expect(names).toContain('Pinyon Script');
      expect(names).toContain('Great Vibes');
    });

    test('deve incluir pelo menos uma fonte ultra-dramatic', () => {
      const ultraDramatic = CURSIVE_FONTS.filter(f => f.category === 'ultra-dramatic');
      expect(ultraDramatic.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SERIF_FONTS catalog', () => {
    test('deve ter ao menos 6 fontes serifadas', () => {
      expect(SERIF_FONTS.length).toBeGreaterThanOrEqual(6);
    });

    test('cada fonte deve ter name e googleFamily', () => {
      SERIF_FONTS.forEach(font => {
        expect(font.name).toBeTruthy();
        expect(font.googleFamily).toBeTruthy();
      });
    });

    test('deve incluir Cormorant Garamond e Playfair Display', () => {
      const names = SERIF_FONTS.map(f => f.name);
      expect(names).toContain('Cormorant Garamond');
      expect(names).toContain('Playfair Display');
    });
  });

  describe('getFontUrl helper', () => {
    test('deve retornar URL válida do Google Fonts', () => {
      const url = getFontUrl('Pinyon+Script', 'Layslla & Marcus');
      expect(url).toContain('fonts.googleapis.com');
      expect(url).toContain('Pinyon+Script');
    });

    test('deve incluir o texto de preview encodado', () => {
      const url = getFontUrl('Great+Vibes', 'A & B');
      expect(url).toContain('text=');
    });

    test('deve incluir display=swap para evitar FOUC', () => {
      const url = getFontUrl('Dancing+Script', 'test');
      expect(url).toContain('display=swap');
    });
  });
});
