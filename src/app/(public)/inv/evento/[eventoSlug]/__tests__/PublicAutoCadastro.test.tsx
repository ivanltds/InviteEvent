import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicAutoCadastroPage from '../page';
import { eventService } from '@/lib/services/eventService';
import { configService } from '@/lib/services/configService';
import { inviteService } from '@/lib/services/inviteService';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ eventoSlug: 'casamento-ana-carlos' }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/services/eventService', () => ({
  eventService: { getEventoBySlug: jest.fn() },
}));
jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn() },
}));
jest.mock('@/lib/services/inviteService', () => ({
  inviteService: { criarConviteAutoCadastro: jest.fn() },
}));

const baseEvento = { id: 'e1', slug: 'casamento-ana-carlos', nome: 'Casamento' };
const linkUnicoConfig = {
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  modo_convite: 'link_unico' as const,
};

describe('PublicAutoCadastroPage (Link Único)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('mostra "convite não encontrado" para um slug de evento inválido', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(null);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
  });

  it('bloqueia o acesso se o evento não estiver no modo Link Único', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue({ ...linkUnicoConfig, modo_convite: 'individual' });

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByText(/utilize o link enviado pelos noivos/i)).toBeInTheDocument());
  });

  it('redireciona direto se já existe convite salvo no navegador', async () => {
    localStorage.setItem('link_unico_convite_casamento-ana-carlos', JSON.stringify({ slug: 'joao-silva-a1b2' }));
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue(linkUnicoConfig);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/inv/joao-silva-a1b2'));
  });

  it('mostra o formulário de auto-identificação na primeira visita', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue(linkUnicoConfig);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());
    expect(screen.getByText(/Vem mais alguém com você/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('adiciona e remove campos de acompanhante', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue(linkUnicoConfig);

    render(<PublicAutoCadastroPage />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/\+ Adicionar acompanhante/i));
    expect(screen.getByPlaceholderText(/Nome do acompanhante/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remover acompanhante/i }));
    expect(screen.queryByPlaceholderText(/Nome do acompanhante/i)).not.toBeInTheDocument();
  });

  it('ao confirmar, cria o convite, salva no navegador e redireciona', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue(linkUnicoConfig);
    (inviteService.criarConviteAutoCadastro as jest.Mock).mockResolvedValue({ success: true, slug: 'joao-silva-a1b2' });

    render(<PublicAutoCadastroPage />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText(/\+ Adicionar acompanhante/i));
    fireEvent.change(screen.getByPlaceholderText(/Nome do acompanhante/i), { target: { value: 'Maria Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() =>
      expect(inviteService.criarConviteAutoCadastro).toHaveBeenCalledWith('e1', 'João Silva', ['Maria Silva'])
    );
    expect(mockReplace).toHaveBeenCalledWith('/inv/joao-silva-a1b2');
    expect(JSON.parse(localStorage.getItem('link_unico_convite_casamento-ana-carlos')!)).toEqual({ slug: 'joao-silva-a1b2' });
  });

  it('mostra mensagem de erro sem travar a tela se a criação falhar', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    (configService.getConfig as jest.Mock).mockResolvedValue(linkUnicoConfig);
    (inviteService.criarConviteAutoCadastro as jest.Mock).mockResolvedValue({ success: false, error: new Error('boom') });

    render(<PublicAutoCadastroPage />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() => expect(screen.getByText(/Não conseguimos confirmar/i)).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
