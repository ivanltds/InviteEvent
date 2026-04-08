import { inviteService } from '../inviteService';

describe('InviteService - Slug Obfuscation (STORY-028)', () => {
  test('generateObfuscatedSlug deve gerar um slug com sufixo aleatório', () => {
    const name = 'Família Silva';
    const slug1 = inviteService.generateObfuscatedSlug(name);
    const slug2 = inviteService.generateObfuscatedSlug(name);

    // O slug deve começar com o nome normalizado
    expect(slug1).toMatch(/^familia-silva-[a-f0-9]{4}$/);
    expect(slug2).toMatch(/^familia-silva-[a-f0-9]{4}$/);
    
    // Os sufixos devem ser diferentes (probabilidade altíssima)
    expect(slug1).not.toBe(slug2);
  });

  test('generateObfuscatedSlug deve tratar caracteres especiais', () => {
    const name = 'João & Maria @ 2026!';
    const slug = inviteService.generateObfuscatedSlug(name);
    
    expect(slug).toMatch(/^joao-maria-2026-[a-f0-9]{4}$/);
  });
});
