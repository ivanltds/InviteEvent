import { render, screen, waitFor } from '@testing-library/react';
import InvitationPage from '../page';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// Mock de navegação e params
jest.mock('next/navigation', () => ({
  useParams: jest.fn()
}));

jest.mock('@/components/ui/HeroCarousel', () => () => <div data-testid="carousel">Carousel</div>);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="rsvp">RSVP</div>);
jest.mock('@/components/sections/Countdown', () => () => <div data-testid="countdown">Countdown</div>);

describe('Invitation Page (/inv/[slug])', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'convidado-teste' });
  });

  test('deve carregar nomes e data do casal do banco de dados', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          noiva_nome: 'Layslla',
          noivo_nome: 'Marcus',
          data_casamento: '2026-06-13',
          mostrar_historia: true,
          mostrar_noivos: true,
          mostrar_faq: true,
          mostrar_presentes: true
        },
        error: null
      })
    });

    render(<InvitationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Layslla & Marcus/i)).toBeInTheDocument();
      // Usando getAllByText porque a data aparece no Hero e nos Detalhes
      expect(screen.getAllByText(/13 de junho de 2026/i).length).toBeGreaterThan(0);
    });
  });
});
