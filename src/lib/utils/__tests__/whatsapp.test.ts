import { generateWhatsappLink } from '../whatsapp';

describe('WhatsApp Utility', () => {
  it('should generate valid link with variables', () => {
    const link = generateWhatsappLink('11999999999', 'Olá {nome}, seu link: {link}', { nome: 'Ivan', link: 'bit.ly' });
    expect(link).toContain('wa.me/5511999999999');
    expect(link).toContain(encodeURIComponent('Olá Ivan, seu link: bit.ly'));
  });

  it('should handle phone with country code', () => {
    const link = generateWhatsappLink('5511999999999', 'Oi', { nome: '', link: '' });
    expect(link).toContain('wa.me/5511999999999');
  });

  it('should handle empty phone', () => {
    const link = generateWhatsappLink('', 'Oi', { nome: '', link: '' });
    expect(link).toContain('wa.me/?text=Oi');
  });
});
