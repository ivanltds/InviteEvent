import { render, screen, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';
import { useEvent } from '@/lib/contexts/EventContext';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(() => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  })),
}));

// Mock do inviteService
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    calculateDashboardStats: jest.fn(),
    generateObfuscatedSlug: jest.fn(),
  },
}));

// Mock do configService
jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn().mockResolvedValue({ noiva_nome: 'Noiva', noivo_nome: 'Noivo' }),
  },
}));

describe('Admin Export CSV (STORY-015 - TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([{ id: 'c1', nome_principal: 'João Silva', rsvp: [{ confirmados: 2, status: 'confirmado' }] }]);
    (inviteService.calculateDashboardStats as jest.Mock).mockReturnValue({
      totalConvites: 1,
      convitesRespondidos: 1,
      pessoasConfirmadas: 2,
      pessoasRecusadas: 0,
      pessoasPendentes: 0,
      excedentes: 0
    });
  });

  it('should have an "Exportar CSV" button', async () => {
    render(<AdminConvidados />);
    
    await waitFor(() => {
      const exportBtn = screen.getByText(/Exportar CSV/i);
      expect(exportBtn).toBeInTheDocument();
    });
  });
});
