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

    // Mock do localStorage para bypassar a animação (US-NOVA-001)
    const mockGetItem = jest.fn((key) => {
      if (key.includes('envelope_views_')) return '3'; // Simula que já passou do limite de views
      return null;
    });
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem, setItem: jest.fn() },
      writable: true
    });
  });

  test('deve carregar nomes e data do casal do banco de dados', async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };

      if (table === 'convites') {
        mockChain.maybeSingle.mockResolvedValue({ data: { id: 'c1', evento_id: 'e1' }, error: null });
      } else if (table === 'configuracoes') {
        mockChain.maybeSingle.mockResolvedValue({
          data: {
            evento_id: 'e1',
            noiva_nome: 'Layslla',
            noivo_nome: 'Marcus',
            data_casamento: '2026-06-13',
            mostrar_historia: true,
            mostrar_noivos: true,
            mostrar_faq: true,
            mostrar_presentes: true
          },
          error: null
        });
      }

      return mockChain;
    });

    render(<InvitationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Layslla & Marcus/i)).toBeInTheDocument();
      // Usando regex para aceitar variações de capitalização ou espaços
      expect(screen.getAllByText(/junho de 2026/i).length).toBeGreaterThan(0);
    });
  });
});
