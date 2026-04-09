import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';
import { configService } from '@/lib/services/configService';

// Mock do configService
jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn().mockResolvedValue({ whatsapp_template: 'Olá {nome}' }),
  },
}));

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: () => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  }),
}));

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    deleteInvite: jest.fn(),
    calculateDashboardStats: jest.fn().mockReturnValue({
      totalConvites: 0,
      convitesRespondidos: 0,
      pessoasConfirmadas: 0,
      pessoasRecusadas: 0,
      pessoasPendentes: 0,
      excedentes: 0
    }),
  },
}));

describe('AdminConvidados Cancel Delete', () => {
  test('não deve excluir se cancelar confirmação', async () => {
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([{ id: '1', nome_principal: 'J', rsvp: [] }]);
    window.confirm = jest.fn(() => false);
    
    render(<AdminConvidados />);
    await waitFor(() => screen.getByText('J'));
    
    fireEvent.click(screen.getByText('Excluir'));
    expect(inviteService.deleteInvite).not.toHaveBeenCalled();
  });
});
