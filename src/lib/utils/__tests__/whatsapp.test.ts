import { generateWhatsappLink, renderWhatsappTemplate, DEFAULT_WHATSAPP_TEMPLATE } from '../whatsapp';

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

describe('renderWhatsappTemplate', () => {
  it('substitui {nome} e {link} pelo texto puro, sem gerar nenhum link', () => {
    const text = renderWhatsappTemplate('Oi {nome}! Confirme aqui: {link}', { nome: 'Ana', link: 'https://x.com/y' });
    expect(text).toBe('Oi Ana! Confirme aqui: https://x.com/y');
  });

  it('substitui múltiplas ocorrências da mesma variável', () => {
    const text = renderWhatsappTemplate('{nome}, {nome}! {link} {link}', { nome: 'Ana', link: 'L' });
    expect(text).toBe('Ana, Ana! L L');
  });
});

describe('DEFAULT_WHATSAPP_TEMPLATE', () => {
  it('contém a variável {link} para nunca virar uma mensagem sem o convite', () => {
    expect(DEFAULT_WHATSAPP_TEMPLATE).toContain('{link}');
  });
});
