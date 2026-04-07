import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';

// Mock do inviteService
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    createInvite: jest.fn(),
  },
}));

const mockInvites = [
  { 
    id: '1', 
    nome_principal: 'João Silva', 
    tipo: 'individual', 
    limite_pessoas: 1, 
    slug: 'joao-silva', 
    created_at: '2023-01-01',
    rsvp: [{ status: 'confirmado', confirmados: 1, mensagem: 'M1', restricoes: 'R1' }]
  },
];

describe('AdminConvidados Component Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue(mockInvites);
    window.alert = jest.fn();
    
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });

  test('deve listar convidados ao carregar', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument());
  });

  test('deve abrir modal e permitir adicionar novo convite', async () => {
    render(<AdminConvidados />);
    
    const openBtn = screen.getByRole('button', { name: /Novo Convite/i });
    fireEvent.click(openBtn);
    
    // Agora buscamos pelo Heading do modal para diferenciar do botão
    expect(screen.getByRole('heading', { name: /Novo Convite/i })).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/Nome do Convite/i), { target: { value: 'Família Teste' } });
    (inviteService.createInvite as jest.Mock).mockResolvedValue({ success: true });
    
    fireEvent.click(screen.getByRole('button', { name: /Criar Convite/i }));
    
    await waitFor(() => {
      expect(inviteService.createInvite).toHaveBeenCalledWith(expect.objectContaining({
        nome_principal: 'Família Teste'
      }));
    });
  });

  test('deve permitir exportar CSV', async () => {
    // Mock do clique para evitar erro de navegação no jsdom
    const spyClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<AdminConvidados />);
    await waitFor(() => screen.getByText('João Silva'));
    
    fireEvent.click(screen.getByText('Exportar CSV'));
    
    expect(spyClick).toHaveBeenCalled();
    spyClick.mockRestore();
  });
});
