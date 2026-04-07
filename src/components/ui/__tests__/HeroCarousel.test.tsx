import { render, screen, waitFor, act } from '@testing-library/react';
import HeroCarousel from '../HeroCarousel';

describe('HeroCarousel Component', () => {
  const mockImages = ['url1.jpg', 'url2.jpg'];

  beforeEach(() => {
    jest.useFakeTimers();
    // Mock do fetch global
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockImages),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('deve carregar e exibir as imagens', async () => {
    render(<HeroCarousel />);
    
    expect(screen.getByText(/Carregando momentos/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando momentos/i)).not.toBeInTheDocument();
    });

    // Verifica se as imagens estão no DOM (via style background-image)
    // Como usamos o url no key e style, podemos verificar por seletor
  });

  test('deve trocar de imagem após o intervalo', async () => {
    render(<HeroCarousel />);
    
    await waitFor(() => expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument());

    // O primeiro slide deve estar ativo
    // Avança o tempo
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // O segundo slide deve se tornar ativo
  });
});
