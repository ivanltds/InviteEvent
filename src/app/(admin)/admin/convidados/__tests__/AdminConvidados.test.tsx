import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';
import { configService } from '@/lib/services/configService';
import { useEvent } from '@/lib/contexts/EventContext';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

// Mock do inviteService
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    createInvite: jest.fn(),
    updateInvite: jest.fn(),
    deleteInvite: jest.fn(),
    generateObfuscatedSlug: jest.fn((name) => `slug-${name.toLowerCase().replace(/ /g, '-')}`),
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

// Mock do configService
jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn().mockResolvedValue({
      whatsapp_template: 'Olá {nome}, aqui está o seu link: {link}',
    }),
  },
}));

const mockInvites = [
  { 
    id: '1', 
    nome_principal: 'João Silva', 
    tipo: 'individual', 
    limite_pessoas: 1, 
    slug: 'joao-silva', 
    telefone: '11999999999',
    created_at: '2023-01-01',
    rsvp: [{ status: 'confirmado', confirmados: 1, mensagem: 'M1', restricoes: 'R1' }]
  },
];

describe('AdminConvidados Component Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
      loading: false,
      userProfile: { id: 'u1', is_master: true }
    });
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

  test('deve renderizar o botão do WhatsApp e abrir link ao clicar', async () => {
    const spyOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<AdminConvidados />);
    
    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument());
    
    const whatsappBtn = screen.getByTitle('Enviar convite via WhatsApp');
    expect(whatsappBtn).toBeInTheDocument();
    
    fireEvent.click(whatsappBtn);
    expect(spyOpen).toHaveBeenCalledWith(expect.stringContaining('11999999999'), '_blank');
    spyOpen.mockRestore();
  });

  test('deve abrir modal e permitir adicionar novo convite', async () => {
    render(<AdminConvidados />);
    
    await waitFor(() => expect(screen.queryByText(/Carregando convidados/i)).not.toBeInTheDocument());
    
    const openBtn = screen.getByRole('button', { name: /Novo Convite/i });
    fireEvent.click(openBtn);
    
    expect(screen.getByRole('heading', { name: /Novo Convite/i })).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/Nome do Convite/i), { target: { value: 'Família Teste' } });
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '11888888888' } });
    (inviteService.createInvite as jest.Mock).mockResolvedValue({ success: true });
    
    fireEvent.click(screen.getByRole('button', { name: /Criar Convite/i }));
    
    await waitFor(() => {
      expect(inviteService.createInvite).toHaveBeenCalledWith(expect.objectContaining({
        nome_principal: 'Família Teste',
        telefone: '11888888888'
      }));
    });
  });

  test('deve permitir exportar CSV', async () => {
    const spyClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<AdminConvidados />);
    await waitFor(() => screen.getByText('João Silva'));
    
    fireEvent.click(screen.getByText('Exportar CSV'));
    
    expect(spyClick).toHaveBeenCalled();
    spyClick.mockRestore();
  });
});
