import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';
import { configService } from '@/lib/services/configService';
import { useEvent } from '@/lib/contexts/EventContext';

/**
 * Pedido do usuário: "quero poder ver quantas pessoas um convidado chamou
 * ao expandir a linha dele na tabela de convidados."
 */
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: {
    getAllInvites: jest.fn(),
    calculateDashboardStats: jest.fn().mockReturnValue({
      totalConvites: 0,
      convitesRespondidos: 0,
      pessoasConfirmadas: 0,
      pessoasRecusadas: 0,
      pessoasPendentes: 0,
      excedentes: 0,
    }),
  },
}));

jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn().mockResolvedValue({}) },
}));

const mockInvites = [
  {
    id: '1',
    nome_principal: 'Família Silva',
    tipo: 'familia',
    limite_pessoas: 3,
    slug: 'familia-silva',
    created_at: '2026-01-01',
    rsvp: [{ status: 'confirmado', confirmados: 3, mensagem: '', restricoes: '' }],
    membros: [
      { id: 'm1', nome: 'João Silva', confirmado: true },
      { id: 'm2', nome: 'Maria Silva', confirmado: true },
      { id: 'm3', nome: 'Pedro Silva', confirmado: false },
    ],
  },
  {
    id: '2',
    nome_principal: 'Convite Sem Membros',
    tipo: 'individual',
    limite_pessoas: 1,
    slug: 'sem-membros',
    created_at: '2026-01-01',
    rsvp: null,
    membros: [],
  },
];

describe('AdminConvidados — linha expansível de acompanhantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
      loading: false,
      userProfile: { id: 'u1', is_master: true },
    });
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue(mockInvites);
  });

  it('mostra a contagem de pessoas chamadas em cada linha, sem expandir', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Família Silva')).toBeInTheDocument());

    expect(screen.getByText('3 pessoas chamadas')).toBeInTheDocument();
    expect(screen.getByText('1 pessoa chamada')).toBeInTheDocument();
  });

  it('não mostra os detalhes dos membros antes de expandir', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Família Silva')).toBeInTheDocument());

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
  });

  it('expande a linha e mostra nome + status de cada acompanhante', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Família Silva')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Ver quantas pessoas Família Silva chamou/i }));

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Pedro Silva')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmado')).toHaveLength(2);
    expect(screen.getByText('Recusado')).toBeInTheDocument();
    expect(screen.getByText('3 pessoas nominadas neste convite')).toBeInTheDocument();
  });

  it('recolhe ao clicar de novo no mesmo botão', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Família Silva')).toBeInTheDocument());

    const toggle = screen.getByRole('button', { name: /Ver quantas pessoas Família Silva chamou/i });
    fireEvent.click(toggle);
    expect(screen.getByText('João Silva')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Recolher detalhes de Família Silva/i }));
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
  });

  it('expandir um convite fecha o outro (só um aberto por vez)', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Família Silva')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Ver quantas pessoas Família Silva chamou/i }));
    expect(screen.getByText('João Silva')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ver quantas pessoas Convite Sem Membros chamou/i }));
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    expect(screen.getByText(/Convite sem membros nominais/i)).toBeInTheDocument();
  });

  it('convite sem membros nominais mostra mensagem de fallback ao expandir', async () => {
    render(<AdminConvidados />);
    await waitFor(() => expect(screen.getByText('Convite Sem Membros')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Ver quantas pessoas Convite Sem Membros chamou/i }));

    expect(screen.getByText('Convite sem membros nominais (limite de 1 pessoa)')).toBeInTheDocument();
    expect(screen.getByText('Nenhum membro nominal cadastrado para este convite.')).toBeInTheDocument();
  });
});
