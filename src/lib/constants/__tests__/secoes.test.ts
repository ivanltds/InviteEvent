import { resolveSecoesOrdem, SECOES_CONVITE_ORDEM_PADRAO } from '../secoes';

describe('resolveSecoesOrdem', () => {
  it('retorna a ordem padrão quando nada foi salvo', () => {
    expect(resolveSecoesOrdem(undefined)).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
    expect(resolveSecoesOrdem(null)).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
    expect(resolveSecoesOrdem([])).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
  });

  it('respeita a ordem customizada salva', () => {
    expect(resolveSecoesOrdem(['faq', 'historia', 'rsvp', 'noivos', 'agenda'])).toEqual([
      'faq', 'historia', 'rsvp', 'noivos', 'agenda',
    ]);
  });

  it('descarta chaves inválidas/desconhecidas', () => {
    expect(resolveSecoesOrdem(['historia', 'lixo', 'faq', 'noivos', 'agenda', 'rsvp'])).toEqual([
      'historia', 'faq', 'noivos', 'agenda', 'rsvp',
    ]);
  });

  it('descarta duplicatas, mantendo a primeira ocorrência', () => {
    expect(resolveSecoesOrdem(['historia', 'historia', 'noivos', 'agenda', 'rsvp', 'faq'])).toEqual([
      'historia', 'noivos', 'agenda', 'rsvp', 'faq',
    ]);
  });

  it('acrescenta ao final, na ordem padrão, qualquer seção ausente do array salvo', () => {
    // Simula uma config antiga salva antes desta feature existir (array incompleto)
    expect(resolveSecoesOrdem(['faq', 'historia'])).toEqual(['faq', 'historia', 'noivos', 'agenda', 'rsvp']);
  });
});
