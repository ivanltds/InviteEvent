import { render, screen, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { supabase } from '@/lib/supabase';
import { inviteService } from '@/lib/services/inviteService';

// Mock do inviteService
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn().mockResolvedValue([{ id: 'c1', nome_principal: 'João Silva', rsvp: [{ confirmados: 2, status: 'confirmado' }] }]),
    calculateDashboardStats: jest.fn().mockReturnValue({
      totalConvites: 1,
      convitesRespondidos: 1,
      pessoasConfirmadas: 2,
      pessoasRecusadas: 0,
      pessoasPendentes: 0,
      excedentes: 0
    }),
  },
}));

// Mock do Supabase
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
        order: jest.fn().mockResolvedValue({ 
          data: [{ id: 'c1', nome_principal: 'João Silva', rsvp: [{ confirmados: 2, status: 'confirmado' }] }], 
          error: null 
        }),
      };
    }),
  },
}));

describe('Admin Export CSV (STORY-015 - TDD)', () => {
  it('should have an "Exportar CSV" button', async () => {
    render(<AdminConvidados />);
    
    await waitFor(() => {
      const exportBtn = screen.getByText(/Exportar CSV/i);
      expect(exportBtn).toBeInTheDocument();
    });
  });
});
