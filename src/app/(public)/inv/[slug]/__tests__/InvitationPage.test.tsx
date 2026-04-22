import { render, screen, waitFor } from '@testing-library/react';
import InvitationPage from '../page';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// Mock de componentes pesados
jest.mock('@/components/ui/HeroCarousel', () => () => <div data-testid="carousel">Carousel</div>);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="rsvp">RSVP</div>);
jest.mock('@/components/sections/Countdown', () => () => <div data-testid="countdown">Countdown</div>);

describe('Invitation Page (/inv/[slug])', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configura o mock global para este teste específico
    (useParams as jest.Mock).mockReturnValue({ slug: 'convidado-teste' });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
       const chain = (supabase as any).from().select(); 
       if (table === 'convites') {
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
    render(<InvitationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Layslla & Marcus/i)).toBeInTheDocument();
    });
  });
});
