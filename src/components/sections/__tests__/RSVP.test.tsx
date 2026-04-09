import { render, screen, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock consistente para o encadeamento do Supabase
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = jest.fn();

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  insert: mockInsert,
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockQueryBuilder),
  },
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
      expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
    });
  });

  it('deve carregar o formulário quando um convite válido é fornecido', async () => {
    // Mock do URLSearchParams retornando o slug
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('joao-silva')
    }));

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null })
      .mockResolvedValueOnce({ 
        data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva' }, 
        error: null 
      });

    render(<RSVP />);
    
    await waitFor(() => {
      expect(screen.getByText(/Olá,/)).toBeInTheDocument();
      expect(screen.getByText(/João Silva/)).toBeInTheDocument();
    });
  });
});
