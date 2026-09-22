import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamManagement from '../TeamManagement';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

jest.mock('@/lib/services/eventService', () => ({
  eventService: {
    getOrganizers: jest.fn(),
    getTeamInvites: jest.fn(),
    createTeamInvite: jest.fn(),
    addOrganizer: jest.fn(),
    updateOrganizerRole: jest.fn(),
    removeOrganizer: jest.fn(),
    revokeTeamInvite: jest.fn(),
  },
}));

describe('TeamManagement Component - Multi-Owner & Magic Links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Casamento Teste' },
      userProfile: { id: 'u1', email: 'noiva@teste.com', is_master: false },
      userRole: 'owner',
      loading: false,
    });

    (eventService.getOrganizers as jest.Mock).mockResolvedValue([
      { evento_id: 'e1', user_id: 'u1', role: 'owner', email: 'noiva@teste.com' },
      { evento_id: 'e1', user_id: 'u2', role: 'organizador', email: 'assessor@teste.com' },
    ]);

    (eventService.getTeamInvites as jest.Mock).mockResolvedValue([]);
  });

  it('should render Magic Link (Opção 1) and Email (Opção 2) sections', async () => {
    render(<TeamManagement />);

    expect(await screen.findByText(/Opção 1: Link Mágico/i)).toBeInTheDocument();
    expect(screen.getByText(/Opção 2: Adicionar por E-mail/i)).toBeInTheDocument();
    expect(await screen.findByText('noiva@teste.com')).toBeInTheDocument();
    expect(await screen.findByText('assessor@teste.com')).toBeInTheDocument();
  });

  it('should generate magic link when clicking generate button', async () => {
    (eventService.createTeamInvite as jest.Mock).mockResolvedValue({
      id: 'inv1',
      token: 'tok-abc-123',
      role: 'owner',
    });

    render(<TeamManagement />);

    const generateBtn = await screen.findByRole('button', { name: /Gerar Link Mágico/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(eventService.createTeamInvite).toHaveBeenCalledWith('e1', 'owner');
      expect(screen.getByText(/Link de Convite Gerado:/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/tok-abc-123/i)).toBeInTheDocument();
    });
  });

  it('should call addOrganizer when submitting email form', async () => {
    (eventService.addOrganizer as jest.Mock).mockResolvedValue(true);

    render(<TeamManagement />);

    const input = await screen.findByPlaceholderText(/E-mail da pessoa/i);
    const submitBtn = screen.getByRole('button', { name: 'Adicionar' });

    fireEvent.change(input, { target: { value: 'noivo@teste.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(eventService.addOrganizer).toHaveBeenCalledWith('e1', 'noivo@teste.com', 'owner');
    });
  });

  it('should allow promoting organizer to owner', async () => {
    (eventService.updateOrganizerRole as jest.Mock).mockResolvedValue(true);

    render(<TeamManagement />);

    const promoteBtn = await screen.findByRole('button', { name: /Tornar Proprietário/i });
    fireEvent.click(promoteBtn);

    await waitFor(() => {
      expect(eventService.updateOrganizerRole).toHaveBeenCalledWith('e1', 'u2', 'owner');
    });
  });
});
