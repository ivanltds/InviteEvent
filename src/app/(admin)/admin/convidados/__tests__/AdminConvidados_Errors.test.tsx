import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    updateInvite: jest.fn(),
    deleteInvite: jest.fn(),
  },
}));

const mockInvite = { 
  id: '1', nome_principal: 'João', limite_pessoas: 1, tipo: 'individual', slug: 'j', created_at: '2023-01-01', rsvp: [] 
};

describe('AdminConvidados Error Paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([mockInvite]);
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  test('deve lidar com erro ao atualizar convite', async () => {
    (inviteService.updateInvite as jest.Mock).mockResolvedValue({ success: false, error: new Error('Update Error') });
    render(<AdminConvidados />);
    
    await waitFor(() => screen.getByText('João'));
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Update Error'));
    });
  });

  test('deve lidar com erro ao excluir convite', async () => {
    (inviteService.deleteInvite as jest.Mock).mockResolvedValue({ success: false, error: new Error('Delete Error') });
    render(<AdminConvidados />);
    
    await waitFor(() => screen.getByText('João'));
    fireEvent.click(screen.getByText('Excluir'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Delete Error'));
    });
  });
});
