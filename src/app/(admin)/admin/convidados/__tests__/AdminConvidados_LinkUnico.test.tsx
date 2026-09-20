import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { inviteService } from '@/lib/services/inviteService';
import { configService } from '@/lib/services/configService';
import { useEvent } from '@/lib/contexts/EventContext';

jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(),
}));

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
      excedentes: 0,
    }),
  },
}));

jest.mock('@/lib/services/configService', () => ({
  configService: { getConfig: jest.fn() },
}));

const mockInvites = [
  {
    id: '1',
    nome_principal: 'João Silva (auto-cadastrado)',
    tipo: 'individual',
    limite_pessoas: 1,
    slug: 'joao-silva-a1b2',
    created_at: '2026-01-01',
    rsvp: [{ status: 'confirmado', confirmados: 1 }],
  },
];

describe('AdminConvidados — modo Link Único', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    (useEvent as jest.Mock).mockReturnValue({
      currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'casamento-ana-carlos' },
      loading: false,
      userProfile: { id: 'u1', is_master: true },
    });
    (inviteService.getAllInvites as jest.Mock).mockResolvedValue(mockInvites);
  });

  test('sem banner de Link Único quando o modo é individual', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ modo_convite: 'individual' });
    render(<AdminConvidados />);

    await waitFor(() => expect(screen.getByText('João Silva (auto-cadastrado)')).toBeInTheDocument());
    expect(screen.queryByText(/Link Único ativo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ⓘ auto/i)).not.toBeInTheDocument();
  });

  test('mostra banner e tag "auto" quando o modo é Link Único', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ modo_convite: 'link_unico' });
    render(<AdminConvidados />);

    await waitFor(() => expect(screen.getByText(/Link Único ativo/i)).toBeInTheDocument());
    expect(screen.getByText(/ⓘ auto/i)).toBeInTheDocument();
  });

  test('botão de copiar link único copia a URL correta pro clipboard', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ modo_convite: 'link_unico' });
    render(<AdminConvidados />);

    await waitFor(() => expect(screen.getByText(/Link Único ativo/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Copiar link para enviar/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/inv/evento/casamento-ana-carlos')
    );
  });

  // Pedido do usuário em 20/09/2026: "quero tbm que venha o texto
  // configurado para mensagem no whats app e não copie apenas o link" —
  // copiar deve trazer a mensagem completa, não só a URL crua.
  test('copia a mensagem completa com o template configurado, não só o link cru', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({
      modo_convite: 'link_unico',
      whatsapp_template: 'Oi {nome}! Vem celebrar com a gente: {link} 💛',
    });
    render(<AdminConvidados />);

    await waitFor(() => expect(screen.getByText(/Link Único ativo/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Copiar link para enviar/i }));

    const copiedText = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(copiedText).toContain('Vem celebrar com a gente:');
    expect(copiedText).toContain('/inv/evento/casamento-ana-carlos');
    expect(copiedText).not.toBe(expect.stringMatching(/^https?:\/\//)); // não é só a URL crua
  });

  test('sem template configurado, cai para uma mensagem padrão (não copia só o link)', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ modo_convite: 'link_unico' });
    render(<AdminConvidados />);

    await waitFor(() => expect(screen.getByText(/Link Único ativo/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Copiar link para enviar/i }));

    const copiedText = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(copiedText.startsWith('http')).toBe(false);
    expect(copiedText).toContain('convidado');
  });
});
