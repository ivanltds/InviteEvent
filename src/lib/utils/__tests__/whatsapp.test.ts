import { generateWhatsappLink } from '../whatsapp';

describe('Whatsapp Link Utility', () => {
  const mockData = {
    telefone: '(11) 99999-9999',
    nome: 'João Silva',
    link: 'https://meusite.com/inv/joao-123',
    template: 'Olá, {nome}! Veja seu convite: {link}'
  };

  test('deve formatar o link corretamente com telefone limpo', () => {
    const url = generateWhatsappLink(mockData.telefone, mockData.template, {
      nome: mockData.nome,
      link: mockData.link
    });

    // Link deve começar com wa.me e ter o telefone com 55 e sem símbolos
    expect(url).toContain('https://wa.me/5511999999999');
    // A mensagem deve estar codificada para URL
    expect(url).toContain('text=Ol%C3%A1%2C%20Jo%C3%A3o%20Silva!%20Veja%20seu%20convite%3A%20https%3A%2F%2Fmeusite.com%2Finv%2Fjoao-123');
  });

  test('deve retornar apenas o link da mensagem se não houver telefone', () => {
    const url = generateWhatsappLink('', mockData.template, { nome: 'João', link: 'link' });
    expect(url).toContain('https://wa.me/?text=');
  });
});
