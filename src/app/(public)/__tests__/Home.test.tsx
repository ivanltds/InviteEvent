import { render, screen } from '@testing-library/react';
import LandingPage from '../page';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Landing Page (Marketing)', () => {
  test('deve renderizar os elementos principais de venda', () => {
    render(<LandingPage />);
    
    expect(screen.getByText(/O Convite do Seu Casamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Experiência cinematográfica incomparável/i)).toBeInTheDocument();
    
    // Busca específica para evitar conflito com o texto de descrição no Hero
    expect(screen.getByRole('heading', { name: /Lista de Presentes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /RSVP Inteligente/i })).toBeInTheDocument();
  });

  test('deve conter o CTA para o admin', () => {
    render(<LandingPage />);
    const ctaButtons = screen.getAllByRole('link', { name: /Começar Jornada Mágica/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
    expect(ctaButtons[0]).toHaveAttribute('href', '/criar');
  });
});
