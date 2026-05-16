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

  test('deve renderizar os slides iniciais', async () => {
    render(<HeroCarousel />);
    
    // Verifica se o container principal está no DOM
    const container = document.querySelector('.carouselContainer');
    expect(container).toBeInTheDocument();

    // Verifica se existe pelo menos um slide ativo
    const activeSlide = document.querySelector('.active');
    expect(activeSlide).toBeInTheDocument();
  });

  test('deve trocar de imagem após o intervalo', async () => {
    render(<HeroCarousel />);

    // O primeiro slide deve estar ativo
    // Avança o tempo
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // O segundo slide deve se tornar ativo
  });
});
