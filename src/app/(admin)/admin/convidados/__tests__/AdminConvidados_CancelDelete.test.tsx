import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    deleteInvite: jest.fn(),
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
