import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { supabase } from '@/lib/supabase';

// Mock dos componentes pesados ou complexos
jest.mock('@/components/ui/HeroCarousel', () => () => <div data-testid="carousel">Carousel</div>);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="rsvp">RSVP</div>);
jest.mock('@/components/sections/Countdown', () => () => <div data-testid="countdown">Countdown</div>);

describe('Home Page Public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve carregar nomes e data do banco de dados', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          noiva_nome: 'Maria',
          noivo_nome: 'José',
          data_casamento: '2026-12-31',
          mostrar_historia: true,
          mostrar_noivos: true,
          mostrar_faq: true,
          mostrar_presentes: true
        },
        error: null
      })
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Maria & José/i)).toBeInTheDocument();
      expect(screen.getByText(/dezembro de 2026/i)).toBeInTheDocument();
    });
  });

  test('deve esconder seções baseadas na configuração', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          noiva_nome: 'L', noivo_nome: 'M', data_casamento: '2026-06-13',
          mostrar_historia: false,
          mostrar_noivos: false,
          mostrar_faq: false,
          mostrar_presentes: false
        },
        error: null
      })
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByText(/Nossa História/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Os Noivos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Perguntas Frequentes/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Lista de Presentes/i)).not.toBeInTheDocument();
    });
  });
});
