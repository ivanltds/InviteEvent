import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

// Mock das fontes do Google
jest.mock('next/font/google', () => ({
  Playfair_Display: () => ({ variable: 'font-playfair' }),
  Pinyon_Script: () => ({ variable: 'font-pinyon' }),
  Inter: () => ({ variable: 'font-inter' }),
}));

// Mock do CookieBanner
jest.mock('@/components/ui/CookieBanner', () => {
  return function MockCookieBanner() {
    return <div data-testid="cookie-banner">Mock CookieBanner</div>;
  };
});

describe('RootLayout', () => {
  test('deve renderizar o conteúdo children e componentes base', () => {
    render(
      <RootLayout>
        <div data-testid="child">Conteúdo de Teste</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
  });
});
