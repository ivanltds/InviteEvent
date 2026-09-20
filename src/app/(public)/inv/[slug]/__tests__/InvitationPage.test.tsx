import { render, screen, waitFor } from '@testing-library/react';
import InvitationPageClient from '../InvitationPageClient';
import { supabase } from '@/lib/supabase';

/**
 * Correção de 20/09/2026: `page.tsx` virou um Server Component fino (só
 * resolve `params` e exporta `generateMetadata` — ver
 * src/lib/metadata/inviteMetadata.ts), então quem é testado aqui é o
 * `InvitationPageClient`, que recebe `slug` como prop em vez de ler via
 * `useParams()`.
 */

// Mock de componentes pesados
jest.mock('@/components/ui/HeroCarousel', () => () => <div data-testid="carousel">Carousel</div>);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="rsvp">RSVP</div>);
jest.mock('@/components/sections/Countdown', () => () => <div data-testid="countdown">Countdown</div>);

describe('Invitation Page (/inv/[slug])', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
       const mockChain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockImplementation(fn => Promise.resolve(fn({ data: [], error: null })))
      };
      const chain = mockChain;if (table === 'convites') {
         chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', evento_id: 'e1' }, error: null });
       } else if (table === 'configuracoes') {
         chain.maybeSingle.mockResolvedValue({
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
       return chain;
    });

    // Mock do localStorage para bypassar a animação
    const mockGetItem = jest.fn((key) => {
      if (key && key.includes('envelope_views_')) return '3';
      return null;
    });
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem, setItem: jest.fn() },
      writable: true
    });
  });

  test('deve carregar nomes e data do casal do banco de dados', async () => {
    render(<InvitationPageClient slug="convidado-teste" />);

    await waitFor(() => {
      expect(screen.getByText(/Layslla & Marcus/i)).toBeInTheDocument();
    });
  });
});
