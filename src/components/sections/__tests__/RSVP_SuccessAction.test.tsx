import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

// Re-mock para garantir flexibilidade
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      const mockChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        single: mockSingle,
        insert: mockInsert,
        update: jest.fn().mockReturnThis(),
        then: (fn: any) => Promise.resolve(fn({ data: [], error: null }))
      };
      return mockChain;
    }),
  },
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Success Redirection (STORY-017 - TDD)', () => {
  const originalURLSearchParams = global.URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('joao-silva')
    }));
    
    // 1. getRSVPConfig inicial (sem inviteId) -> query id=1
    mockMaybeSingle.mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null });
    
    // 2. getInviteBySlug -> query slug='joao-silva'
    mockMaybeSingle.mockResolvedValueOnce({ 
      data: { id: 'c1', nome_principal: 'João Silva', tipo: 'individual', limite_pessoas: 2, slug: 'joao-silva', evento_id: 'e1' }, 
      error: null 
    });

    // 3. getRSVPConfig pos-invite -> rsvpService.getRSVPConfig('c1')
    // chama .from('convites').select('evento_id').eq('id', 'c1').single()
    mockSingle.mockResolvedValueOnce({ data: { evento_id: 'e1' }, error: null });
    // chama .from('configuracoes').select('*').eq('evento_id', 'e1').maybeSingle()
    mockMaybeSingle.mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null });

    // default fallback
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  it('should show "Ver Lista de Presentes" button after successful RSVP', async () => {
    render(<RSVP />);
    
    // Esperar carregar o convite (sai do estado inicial de loading)
    await waitFor(() => expect(screen.getByText(/Olá,/)).toBeInTheDocument());
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText(/Sua presença está confirmada/i)).toBeInTheDocument();
      expect(screen.getByText('Ver Lista de Presentes')).toBeInTheDocument();
    });

    expect(screen.getByText('Ver Lista de Presentes')).toHaveAttribute('href', '/presentes?invite=joao-silva');
  });
});
