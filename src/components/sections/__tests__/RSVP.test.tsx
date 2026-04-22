import { render, screen, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock consistente para o encadeamento do Supabase
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

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
          maybeSingle: mockMaybeSingle,
          single: mockSingle
        };
      }
      if (table === 'convite_membros') {
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
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      };
    }),
  },
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Component (Restricted Access)', () => {
  const originalURLSearchParams = global.URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: 'c1', evento_id: 'e1' }, error: null });
    mockMaybeSingle.mockResolvedValue({ 
      data: { prazo_rsvp: '2026-06-13' }, 
      error: null 
    });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  it('deve mostrar acesso restrito quando não há convite na URL', async () => {
    // Mock do URLSearchParams retornando vazio
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null)
    }));

    render(<RSVP />);
    
    await waitFor(() => {
      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    });
  });

  it('deve carregar o formulário quando um convite válido é fornecido', async () => {
    // Mock do URLSearchParams retornando um convite
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('joao-silva')
    }));

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null })
      .mockResolvedValueOnce({ 
        data: { id: 'c1', nome_principal: 'João Silva', tipo: 'individual', slug: 'joao-silva', limite_pessoas: 1 }, 
        error: null 
      });

    render(<RSVP />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Olá,/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/João Silva/i).length).toBeGreaterThan(0);
    });
  });
});
