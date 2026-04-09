import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { supabase } from '@/lib/supabase';
import { inviteService } from '@/lib/services/inviteService';

// Mock do inviteService
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(() => Promise.resolve(mockInvites)),
    calculateDashboardStats: jest.fn().mockReturnValue({
      totalConvites: 1,
      convitesRespondidos: 0,
      pessoasConfirmadas: 0,
      pessoasRecusadas: 0,
      pessoasPendentes: 2,
      excedentes: 0
    }),
    createInvite: jest.fn((data) => {
      const newItem = { ...data, id: 'c2', created_at: new Date().toISOString(), rsvp: [], membros: [] };
      mockInvites.unshift(newItem);
      return Promise.resolve({ success: true });
    }),
    generateObfuscatedSlug: jest.fn((name) => `slug-${name.toLowerCase().replace(/ /g, '-')}`),
  },
}));

// Mock do Supabase dinâmico
let mockInvites = [
  { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva', tipo: 'casal', created_at: new Date().toISOString(), rsvp: [], membros: [] }
];

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'configuracoes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { noiva_nome: 'Noiva', noivo_nome: 'Noivo' }, error: null })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockInvites, error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
      };
    }),
  },
}));

// Mock do Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Admin Convidados - Fluxo de Criação (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvites = [
      { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva', tipo: 'casal', created_at: new Date().toISOString(), rsvp: [], membros: [] }
    ];
  });

  test('should show a new invite in the list immediately after creation', async () => {
    render(<AdminConvidados />);
    
    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument());
    
    // Abrir modal
    fireEvent.click(screen.getByText(/Novo Convite/i));
    
    // Preencher form
    fireEvent.change(screen.getByLabelText(/Nome do Convite/i), { target: { value: 'Família Teste' } });
    
    // Submeter
    fireEvent.click(screen.getByRole('button', { name: /Criar Convite/i }));
    
    // Agora deve encontrar pois o mock foi atualizado e a função fetchData chamada
    await waitFor(() => {
      expect(screen.getByText('Família Teste')).toBeInTheDocument();
    });
  });
});
