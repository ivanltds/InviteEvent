import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Navbar Component Expanded', () => {
  test('deve renderizar todos os links do menu', () => {
    (usePathname as jest.Mock).mockReturnValue('/inv/test');
    render(<Navbar />);
    
    const links = [
      { name: 'Nossa História', href: '#historia' },
      { name: 'O Evento', href: '#detalhes' },
      { name: 'Confirmar Presença', href: '#rsvp' }
    ];

    links.forEach(link => {
      const element = screen.getByText(link.name);
      expect(element).toBeInTheDocument();
      expect(element.closest('a')).toHaveAttribute('href', link.href);
    });
  });
});
