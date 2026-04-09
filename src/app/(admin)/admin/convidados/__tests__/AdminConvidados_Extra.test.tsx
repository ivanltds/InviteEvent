import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    createInvite: jest.fn(),
    updateInvite: jest.fn(),
    deleteInvite: jest.fn(),
    generateObfuscatedSlug: jest.fn(() => 'test-slug'),
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

describe('AdminConvidados Extra', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([]);
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  test('deve lidar com erro na criação do convite', async () => {
    (inviteService.createInvite as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: { message: 'Erro no Banco' } 
    });

    render(<AdminConvidados />);
    fireEvent.click(screen.getByText(/Novo Convite/i));
    
    fireEvent.change(screen.getByLabelText(/Nome do Convite/i), { target: { value: 'Teste' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar Convite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao criar'));
    });
  });
});
