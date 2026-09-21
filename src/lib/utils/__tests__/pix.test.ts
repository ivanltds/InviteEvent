import { generatePixPayload } from '../pix';

describe('Pix Utility', () => {
  it('should generate valid payload for CPF', () => {
    const payload = generatePixPayload('12345678909', 'Ivan', 'cpf', 'SAO PAULO', 100.50);
    expect(payload).toContain('12345678909');
    expect(payload).toContain('100.50');
    expect(payload).toContain('IVAN');
    expect(payload).toMatch(/[0-9A-F]{4}$/); // CRC
  });

  it('should format email keys correctly', () => {
    const payload = generatePixPayload('TESTE@EMAIL.COM', 'Ivan', 'email');
    expect(payload).toContain('teste@email.com');
  });

  it('should format phone keys with +55', () => {
    const payload = generatePixPayload('11999999999', 'Ivan', 'telefone');
    expect(payload).toContain('+5511999999999');
  });

  it('should return empty string if no key provided', () => {
    expect(generatePixPayload('')).toBe('');
  });

  it('should handle random keys as-is', () => {
    const payload = generatePixPayload('random-key', 'Ivan', 'aleatoria');
    expect(payload).toContain('random-key');
  });

  it('should clean names with special characters', () => {
    const payload = generatePixPayload('key', 'João & Maria!', 'aleatoria');
    expect(payload).toContain('JOAO MARIA');
  });

  // Pedido do usuário em 21/09/2026: "NO APP DA CAIXA NÃO FOI POSSIVEL
  // ENCONTRAR A CHAVE PIX DO COPIA E COLA" — o campo "Point of
  // Initiation Method" (ID 01) é opcional no QR mas alguns apps de
  // banco (Caixa incluído) exigem ele pra reconhecer a chave no fluxo
  // "Copia e Cola" de texto colado.
  it('inclui o campo Point of Initiation Method (ID 01 = "11", estático) logo após o Payload Format Indicator', () => {
    const payload = generatePixPayload('11999999999', 'Ivan', 'telefone');
    // "000201" = ID 00 (Payload Format Indicator), len 02, valor "01"
    // "0102" = ID 01 (Point of Initiation Method), len 02
    // "11" = valor estático
    expect(payload.startsWith('00020101021126')).toBe(true);
    expect(payload).toContain('010211');
  });
});
