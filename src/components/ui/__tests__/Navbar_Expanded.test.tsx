import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

describe('Navbar Component Expanded', () => {
  test('deve renderizar todos os links do menu', () => {
    render(<Navbar />);
    
    const links = [
      { name: 'Nossa História', href: '/#historia' },
      { name: 'O Evento', href: '/#detalhes' },
      { name: 'RSVP', href: '/#rsvp' }
    ];

    links.forEach(link => {
      const element = screen.getByText(link.name);
      expect(element).toBeInTheDocument();
      expect(element.closest('a')).toHaveAttribute('href', link.href);
    });
  });
});
