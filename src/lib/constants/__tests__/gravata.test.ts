import { resolveGravataLabel, GRAVATA_LABEL_TEXT, GRAVATA_LABEL_OPTIONS, GRAVATA_LABEL_PERSONALIZADO_MAX_LENGTH } from '../gravata';

/**
 * Pedido do usuário em 21/09/2026: "texto para o botão da gravata dos
 * noivos deve ser configuravel com as opçõs, mas tbm ter uma caixa de
 * texto com tamanho limitado."
 */

describe('resolveGravataLabel', () => {
  it('retorna o texto do preset quando gravata_label é um preset fechado', () => {
    expect(resolveGravataLabel('quero_presentear')).toBe('Quero presentear');
    expect(resolveGravataLabel('quero_colaborar')).toBe('Quero colaborar');
  });

  it('retorna o texto personalizado quando gravata_label é "personalizado" e há texto', () => {
    expect(resolveGravataLabel('personalizado', 'Ajude na lua de mel')).toBe('Ajude na lua de mel');
  });

  it('remove espaços do texto personalizado', () => {
    expect(resolveGravataLabel('personalizado', '  Contribua com a festa  ')).toBe('Contribua com a festa');
  });

  it('cai pro texto padrão quando "personalizado" está escolhido mas ainda sem texto digitado', () => {
    expect(resolveGravataLabel('personalizado', '')).toBe(GRAVATA_LABEL_TEXT.personalizado);
    expect(resolveGravataLabel('personalizado', undefined)).toBe(GRAVATA_LABEL_TEXT.personalizado);
    expect(resolveGravataLabel('personalizado', '   ')).toBe(GRAVATA_LABEL_TEXT.personalizado);
  });

  it('usa "quero_colaborar" como default quando gravata_label não está definido', () => {
    expect(resolveGravataLabel(undefined)).toBe('Quero colaborar');
    expect(resolveGravataLabel(null)).toBe('Quero colaborar');
  });
});

describe('GRAVATA_LABEL_OPTIONS', () => {
  it('inclui os 2 presets e a opção personalizado', () => {
    expect(GRAVATA_LABEL_OPTIONS).toEqual(['quero_presentear', 'quero_colaborar', 'personalizado']);
  });
});

describe('GRAVATA_LABEL_PERSONALIZADO_MAX_LENGTH', () => {
  it('é um limite razoável pro texto de um botão (30 caracteres)', () => {
    expect(GRAVATA_LABEL_PERSONALIZADO_MAX_LENGTH).toBe(30);
  });
});
