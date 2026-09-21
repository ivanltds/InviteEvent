import { getSavedConvite, saveConvite, clearSavedConvite, findEventoSlugForSavedConvite } from '../linkUnico';

describe('linkUnico (persistência local do auto-cadastro)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna null quando não há convite salvo', () => {
    expect(getSavedConvite('casamento-ana-carlos')).toBeNull();
  });

  it('salva e recupera o slug do convite, por evento', () => {
    saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
    expect(getSavedConvite('casamento-ana-carlos')).toEqual({ slug: 'joao-silva-a1b2' });
  });

  it('não mistura convites salvos de eventos diferentes', () => {
    saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
    saveConvite('casamento-bia-marcos', 'maria-souza-c3d4');

    expect(getSavedConvite('casamento-ana-carlos')).toEqual({ slug: 'joao-silva-a1b2' });
    expect(getSavedConvite('casamento-bia-marcos')).toEqual({ slug: 'maria-souza-c3d4' });
  });

  it('não quebra se o localStorage lançar erro (modo privado, etc.)', () => {
    const original = window.localStorage.getItem;
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => getSavedConvite('casamento-ana-carlos')).not.toThrow();
    expect(getSavedConvite('casamento-ana-carlos')).toBeNull();

    (window.localStorage.getItem as jest.Mock).mockRestore?.();
    window.localStorage.getItem = original;
  });

  it('ignora dado corrompido salvo no localStorage', () => {
    localStorage.setItem('link_unico_convite_casamento-ana-carlos', '{ nao é json válido');
    expect(getSavedConvite('casamento-ana-carlos')).toBeNull();
  });

  // Pedido do usuário em 20/09/2026: quando o convite salvo é excluído,
  // o dispositivo não pode ficar preso pra sempre apontando pro mesmo
  // slug morto — e uma segunda pessoa no mesmo dispositivo precisa
  // conseguir confirmar a presença dela separadamente.
  describe('clearSavedConvite', () => {
    it('remove o vínculo salvo de um evento específico', () => {
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      clearSavedConvite('casamento-ana-carlos');
      expect(getSavedConvite('casamento-ana-carlos')).toBeNull();
    });

    it('não afeta o vínculo salvo de outros eventos', () => {
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      saveConvite('casamento-bia-marcos', 'maria-souza-c3d4');
      clearSavedConvite('casamento-ana-carlos');
      expect(getSavedConvite('casamento-bia-marcos')).toEqual({ slug: 'maria-souza-c3d4' });
    });

    it('não quebra se o localStorage lançar erro', () => {
      jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => clearSavedConvite('casamento-ana-carlos')).not.toThrow();
      (window.localStorage.removeItem as jest.Mock).mockRestore?.();
    });
  });

  describe('findEventoSlugForSavedConvite', () => {
    it('acha o slug do evento a partir do slug do convite salvo', () => {
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      expect(findEventoSlugForSavedConvite('joao-silva-a1b2')).toBe('casamento-ana-carlos');
    });

    it('retorna null quando nenhum evento salvo tem esse convite', () => {
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      expect(findEventoSlugForSavedConvite('slug-desconhecido')).toBeNull();
    });

    it('procura entre múltiplos eventos salvos no mesmo dispositivo', () => {
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      saveConvite('casamento-bia-marcos', 'maria-souza-c3d4');
      expect(findEventoSlugForSavedConvite('maria-souza-c3d4')).toBe('casamento-bia-marcos');
    });

    it('ignora entradas de outras chaves do localStorage e dados corrompidos', () => {
      localStorage.setItem('outra_chave_qualquer', JSON.stringify({ slug: 'joao-silva-a1b2' }));
      localStorage.setItem('link_unico_convite_evento-corrompido', '{ nao é json');
      saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
      expect(findEventoSlugForSavedConvite('joao-silva-a1b2')).toBe('casamento-ana-carlos');
    });

    it('retorna null sem localStorage disponível', () => {
      jest.spyOn(window.localStorage.__proto__, 'key').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => findEventoSlugForSavedConvite('joao-silva-a1b2')).not.toThrow();
      expect(findEventoSlugForSavedConvite('joao-silva-a1b2')).toBeNull();
      (window.localStorage.key as jest.Mock).mockRestore?.();
    });
  });
});
