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

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    updateInvite: jest.fn(),
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

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: () => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  }),
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
    
    // Esperar sair do loading
    await waitFor(() => expect(screen.queryByText(/Carregando convidados/i)).not.toBeInTheDocument());
    
    const editBtn = await screen.findByText('Editar');
    fireEvent.click(editBtn);
    
    expect(await screen.findByRole('heading', { name: /Editar Convite/i })).toBeInTheDocument();
    
    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveBtn);
    
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
    // Esperar sair do loading
    await waitFor(() => expect(screen.queryByText(/Carregando convidados/i)).not.toBeInTheDocument());
    
    const editBtn = await screen.findByText('Editar');
    fireEvent.click(editBtn);
    
    const cancelBtn = await screen.findByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { name: /Editar Convite/i })).not.toBeInTheDocument();
  });
});
