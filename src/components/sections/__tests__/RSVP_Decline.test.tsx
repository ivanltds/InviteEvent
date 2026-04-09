import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = jest.fn();

// Re-mock para garantir flexibilidade
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'configuracoes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingle
        };
      }
      if (table === 'convites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingle
        };
      }
      if (table === 'convidados_membros') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      }
      if (table === 'rsvp') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: mockInsert
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      };
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

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null })
      .mockResolvedValueOnce({ 
        data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva' }, 
        error: null 
      });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  it('should send "recusado" status when guest selects "Infelizmente não poderei ir"', async () => {
    render(<RSVP />);
    
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
