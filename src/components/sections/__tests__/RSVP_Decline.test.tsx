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
        then: (fn: any) => Promise.resolve(fn({ data: [], error: null })) // para membros
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

describe('RSVP Component - Decline Flow (TDD)', () => {
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
      data: { id: 'c1', nome_principal: 'João Silva', tipo: 'individual', slug: 'joao-silva', evento_id: 'e1' }, 
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

  it('should send "recusado" status when guest selects "Infelizmente não poderei ir"', async () => {
    render(<RSVP />);
    
    // Esperar o carregamento do convite
    await waitFor(() => expect(screen.getByLabelText(/poderá celebrar conosco\?/i)).toBeInTheDocument());
    
    const select = screen.getByLabelText(/poderá celebrar conosco\?/i);
    fireEvent.change(select, { target: { value: 'nao' } });
    
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText('Poxa, que pena!')).toBeInTheDocument();
    });

    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ status: 'recusado' })]);
  });
});
