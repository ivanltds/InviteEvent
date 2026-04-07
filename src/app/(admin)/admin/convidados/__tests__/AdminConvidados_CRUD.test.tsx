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

describe('AdminConvidados CRUD Paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([mockInvite]);
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  test('deve editar e salvar convite', async () => {
    (inviteService.updateInvite as jest.Mock).mockResolvedValue({ success: true });
    render(<AdminConvidados />);
    
    await waitFor(() => screen.getByText('João'));
    fireEvent.click(screen.getByText('Editar'));
    
    expect(screen.getByRole('heading', { name: /Editar Convite/i })).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));
    
    await waitFor(() => {
      expect(inviteService.updateInvite).toHaveBeenCalled();
    });
  });

  test('deve permitir excluir convite', async () => {
    (inviteService.deleteInvite as jest.Mock).mockResolvedValue({ success: true });
    render(<AdminConvidados />);
    
    await waitFor(() => screen.getByText('João'));
    fireEvent.click(screen.getByText('Excluir'));
    
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(inviteService.deleteInvite).toHaveBeenCalledWith('1');
    });
  });

  test('deve permitir cancelar edição', async () => {
    render(<AdminConvidados />);
    await waitFor(() => screen.getByText('João'));
    fireEvent.click(screen.getByText('Editar'));
    
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByRole('heading', { name: /Editar Convite/i })).not.toBeInTheDocument();
  });
});
