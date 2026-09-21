import { resolveSecoesOrdem, SECOES_CONVITE_ORDEM_PADRAO } from '../secoes';

describe('resolveSecoesOrdem', () => {
  it('retorna a ordem padrão quando nada foi salvo', () => {
    expect(resolveSecoesOrdem(undefined)).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
    expect(resolveSecoesOrdem(null)).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
    expect(resolveSecoesOrdem([])).toEqual(SECOES_CONVITE_ORDEM_PADRAO);
  });

  it('respeita a ordem customizada salva quando o array já tem todas as seções', () => {
    expect(resolveSecoesOrdem(['faq', 'historia', 'rsvp', 'noivos', 'agenda', 'detalhes'])).toEqual([
      'faq', 'historia', 'rsvp', 'noivos', 'agenda', 'detalhes',
    ]);
  });

  it('descarta chaves inválidas/desconhecidas', () => {
    // 'detalhes' ausente do array salvo, então entra no final (ver teste
    // dedicado abaixo) — aqui o foco é 'lixo' sendo descartado.
    expect(resolveSecoesOrdem(['historia', 'lixo', 'faq', 'noivos', 'agenda', 'rsvp', 'detalhes'])).toEqual([
      'historia', 'faq', 'noivos', 'agenda', 'rsvp', 'detalhes',
    ]);
  });

  it('descarta duplicatas, mantendo a primeira ocorrência', () => {
    expect(resolveSecoesOrdem(['historia', 'historia', 'noivos', 'agenda', 'rsvp', 'faq', 'detalhes'])).toEqual([
      'historia', 'noivos', 'agenda', 'rsvp', 'faq', 'detalhes',
    ]);
  });

  it('acrescenta ao final, na ordem padrão, qualquer seção ausente do array salvo', () => {
    // Simula uma config antiga salva antes desta feature existir (array incompleto)
    expect(resolveSecoesOrdem(['faq', 'historia'])).toEqual(['faq', 'historia', 'detalhes', 'noivos', 'agenda', 'rsvp']);
  });

  it('acrescenta "detalhes" ao final quando ausente de uma config salva antes dessa seção existir', () => {
    // Simula uma config salva quando secoes_ordem só tinha 5 chaves
    // (antes de "detalhes" ser adicionado ao sistema).
    expect(resolveSecoesOrdem(['historia', 'noivos', 'agenda', 'rsvp', 'faq'])).toEqual([
      'historia', 'noivos', 'agenda', 'rsvp', 'faq', 'detalhes',
    ]);
  });
});
