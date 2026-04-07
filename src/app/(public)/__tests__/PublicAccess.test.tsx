import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';
import PresentesPage from '../presentes/page';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { noiva_nome: 'Layslla', noivo_nome: 'Marcus', data_casamento: '2026-06-13', mostrar_presentes: true } }),
        }),
        neq: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

describe('STORY-020: Acesso Público à Lista de Presentes', () => {
  
  test('deve exibir o link "Presentes" na Navbar', async () => {
    render(<Home />);
    // A Navbar deve estar no layout ou na home. Como vamos criar, esperamos que falhe se não existir.
    const navbarLink = screen.queryByRole('link', { name: /presentes/i });
    expect(navbarLink).toBeInTheDocument();
    expect(navbarLink).toHaveAttribute('href', '/presentes');
  });

  test('deve exibir o botão "Lista de Presentes" na Hero da Home', async () => {
    render(<Home />);
    const heroButton = screen.queryByRole('link', { name: /lista de presentes/i });
    expect(heroButton).toBeInTheDocument();
    expect(heroButton).toHaveAttribute('href', '/presentes');
  });

  test('deve exibir mensagem acolhedora na página de presentes', async () => {
    render(<PresentesPage />);
    const welcomeMsg = await screen.findByText(/sua presença é nosso maior presente/i);
    expect(welcomeMsg).toBeInTheDocument();
  });
});
