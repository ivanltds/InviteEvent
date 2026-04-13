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
    
    expect(screen.getByText(/InviteEventAI - Edição Casamentos/i)).toBeInTheDocument();
    expect(screen.getByText(/Crie uma experiência digital inesquecível/i)).toBeInTheDocument();
    
    // Busca específica para evitar conflito com o texto de descrição no Hero
    expect(screen.getByRole('heading', { name: /Lista de Presentes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Presença Confirmada/i })).toBeInTheDocument();
  });

  test('deve conter o CTA para o admin', () => {
    render(<LandingPage />);
    const ctaButtons = screen.getAllByRole('link', { name: /Crie seu convite/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
    expect(ctaButtons[0]).toHaveAttribute('href', '/admin');
  });
});
