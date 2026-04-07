import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    createInvite: jest.fn(),
  },
}));

describe('AdminConvidados Extra', () => {
  test('deve exibir mensagem de lista vazia', async () => {
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([]);
    render(<AdminConvidados />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhum convite cadastrado/i)).toBeInTheDocument();
    });
  });

  test('deve lidar com erro na criação do convite', async () => {
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue([]);
    (inviteService.createInvite as jest.Mock).mockResolvedValue({ success: false, error: new Error('Falha') });
    window.alert = jest.fn();

    render(<AdminConvidados />);
    fireEvent.click(screen.getByRole('button', { name: /Novo Convite/i }));
    fireEvent.change(screen.getByLabelText(/Nome do Convite/i), { target: { value: 'Teste' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar Convite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Falha'));
    });
  });
});
