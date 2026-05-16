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
});
