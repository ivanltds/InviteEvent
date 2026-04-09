import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Re-mock para garantir flexibilidade
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  },
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Component with Members', () => {
  const originalURLSearchParams = global.URLSearchParams;
  const mockMembers = [
    { id: 'm1', nome: 'João', confirmado: null },
    { id: 'm2', nome: 'Maria', confirmado: null }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock URL with invite
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('teste-membros')
    }));

    // Mock Supabase chain
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'configuracoes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { prazo_rsvp: '2026-06-13' }, error: null })
        };
      }
      if (table === 'convites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ 
            data: { id: 'c1', nome_principal: 'Família Silva', limite_pessoas: 2, slug: 'teste-membros' }, 
            error: null 
          })
        };
      }
      if (table === 'convidados_membros') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: mockMembers, error: null })
        };
      }
      if (table === 'rsvp') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      }
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      };
    });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  test('deve renderizar a lista de membros quando disponíveis', async () => {
    render(<RSVP inviteSlug="teste-membros" />);
    
    await waitFor(() => {
      expect(screen.getByText('João')).toBeInTheDocument();
      expect(screen.getByText('Maria')).toBeInTheDocument();
    });
  });

  test('deve alternar status do membro ao clicar', async () => {
    render(<RSVP inviteSlug="teste-membros" />);
    
    await waitFor(() => screen.getByText('João'));
    
    const joaoItem = screen.getByText('João');
    fireEvent.click(joaoItem);
    
    // Verifica se o ícone de check aparece
    await waitFor(() => {
      expect(screen.getByText('João').parentElement?.querySelector('svg')).toBeInTheDocument();
    });
  });
});
