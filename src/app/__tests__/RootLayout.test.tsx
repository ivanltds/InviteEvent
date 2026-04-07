import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

// Mock das fontes do Google
jest.mock('next/font/google', () => ({
  Playfair_Display: () => ({ variable: 'font-playfair' }),
  Pinyon_Script: () => ({ variable: 'font-pinyon' }),
  Inter: () => ({ variable: 'font-inter' }),
}));

// Mock do Navbar para evitar erros de dependência
jest.mock('@/components/ui/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Mock Navbar</nav>;
  };
});

describe('RootLayout', () => {
  test('deve renderizar o Navbar e o conteúdo children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Conteúdo de Teste</div>
      </RootLayout>
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
