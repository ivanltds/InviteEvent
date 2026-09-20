import { getSavedConvite, saveConvite } from '../linkUnico';

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
});
