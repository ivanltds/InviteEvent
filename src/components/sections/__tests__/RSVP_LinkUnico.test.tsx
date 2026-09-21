import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RSVP from '../RSVP';
import { rsvpService } from '@/lib/services/rsvpService';
import { inviteService } from '@/lib/services/inviteService';
import { saveConvite } from '@/lib/utils/linkUnico';

/**
 * Modo Link Único: a identificação ("quem é você / quem você traz") deve
 * acontecer DENTRO do próprio formulário de confirmação de presença, sem
 * gate bloqueante anterior — pedido explícito do usuário em 20/09/2026
 * ("o convite deve abrir primeiro e só na hora de confirmar presença
 * perguntar quem é a pessoa"). Ver src/components/sections/RSVP.tsx.
 */
jest.mock('@/lib/services/rsvpService', () => ({
  rsvpService: {
    getRSVPConfig: jest.fn().mockResolvedValue(null),
    submitFullRSVP: jest.fn(),
    getInviteBySlug: jest.fn(),
    getInviteMembers: jest.fn(),
    getExistingRSVP: jest.fn(),
  },
}));

jest.mock('@/lib/services/inviteService', () => ({
  inviteService: { criarConviteAutoCadastro: jest.fn() },
}));

jest.mock('@/lib/utils/linkUnico', () => ({
  saveConvite: jest.fn(),
  getSavedConvite: jest.fn(() => null),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const autoCadastro = { eventoId: 'e1', eventoSlug: 'casamento-ana-carlos' };

describe('RSVP — modo Link Único (autoCadastro)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rsvpService.getRSVPConfig as jest.Mock).mockResolvedValue(null);
  });

  // Correção de 20/09/2026: "a data na seção de confirmar presença ta
  // errada". No modo Link Único, a data mostrada nunca vinha do prazo de
  // confirmação do evento certo — RSVP.tsx chamava getRSVPConfig() sem
  // nenhum argumento, que caía sempre em configuracoes.id=1 (o primeiro
  // evento cadastrado no sistema), e o fluxo saía cedo demais (early
  // return do autoCadastro) pra nunca corrigir depois. Agora usa direto
  // o `config` recebido por prop (o do evento certo), sem fetch nenhum.
  it('mostra o prazo de confirmação do evento certo (vindo por prop), não de um fetch às cegas', async () => {
    render(
      <RSVP
        autoCadastro={autoCadastro}
        config={{ prazo_rsvp: '2026-10-31' } as any}
      />
    );

    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    expect(screen.getByText(/31 de outubro de 2026/i)).toBeInTheDocument();
    expect(rsvpService.getRSVPConfig).not.toHaveBeenCalled();
  });

  it('mostra direto o formulário de confirmação com os campos de identificação — sem tela separada antes', async () => {
    render(<RSVP autoCadastro={autoCadastro} />);

    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());
    expect(screen.getByText(/Vem mais alguém com você/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar Presença/i })).toBeInTheDocument();
  });

  it('exige o nome antes de enviar', async () => {
    render(<RSVP autoCadastro={autoCadastro} />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Presença/i }));

    await waitFor(() => expect(screen.getByText(/Conta pra gente quem é você/i)).toBeInTheDocument());
    expect(inviteService.criarConviteAutoCadastro).not.toHaveBeenCalled();
  });

  it('ao confirmar, cria o convite, envia o RSVP e salva no navegador', async () => {
    (inviteService.criarConviteAutoCadastro as jest.Mock).mockResolvedValue({
      success: true,
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2', tipo: 'casal', limite_pessoas: 2, nome_principal: 'João Silva' },
      membros: [
        { id: 'm1', nome: 'João Silva', confirmado: null },
        { id: 'm2', nome: 'Maria Silva', confirmado: null },
      ],
    });
    (rsvpService.submitFullRSVP as jest.Mock).mockResolvedValue({ success: true });

    render(<RSVP autoCadastro={autoCadastro} />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText(/\+ Adicionar acompanhante/i));
    fireEvent.change(screen.getByPlaceholderText(/Nome do acompanhante/i), { target: { value: 'Maria Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Presença/i }));

    await waitFor(() =>
      expect(inviteService.criarConviteAutoCadastro).toHaveBeenCalledWith('e1', 'João Silva', ['Maria Silva'])
    );
    await waitFor(() => expect(rsvpService.submitFullRSVP).toHaveBeenCalled());
    expect(saveConvite).toHaveBeenCalledWith('casamento-ana-carlos', 'joao-silva-a1b2');

    const [rsvpPayload, membersPayload] = (rsvpService.submitFullRSVP as jest.Mock).mock.calls[0];
    expect(rsvpPayload).toMatchObject({ convite_id: 'c1', evento_id: 'e1' });
    expect(membersPayload).toEqual([
      expect.objectContaining({ id: 'm1', nome: 'João Silva', confirmado: true }),
      expect.objectContaining({ id: 'm2', nome: 'Maria Silva', confirmado: true }),
    ]);

    await waitFor(() => expect(screen.getByText(/Presença confirmada!/i)).toBeInTheDocument());
  });

  it('mostra mensagem de erro sem travar a tela se a criação do convite falhar', async () => {
    (inviteService.criarConviteAutoCadastro as jest.Mock).mockResolvedValue({ success: false, error: new Error('boom') });

    render(<RSVP autoCadastro={autoCadastro} />);
    await waitFor(() => expect(screen.getByLabelText(/Seu nome/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Seu nome/i), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Presença/i }));

    await waitFor(() => expect(screen.getByText(/Não conseguimos confirmar/i)).toBeInTheDocument());
    expect(rsvpService.submitFullRSVP).not.toHaveBeenCalled();
    expect(saveConvite).not.toHaveBeenCalled();
  });
});

// Pedido do usuário em 21/09/2026: "quando estou em modo de convite
// unico, deve haver a adição nominal de todos os convidados ao
// confirmar a presença." — isso vale também depois que o convite já
// existe (convidado voltando pra editar a resposta, via /inv/[slug]),
// não só no cadastro inicial. Nesse caso o contador anônimo de
// "pessoa(s) extra(s)" (usado no convite tradicional) não deve
// aparecer — só a mesma caixa de nomes do cadastro inicial.
describe('RSVP — modo Link Único, convite já existente (editar resposta)', () => {
  const linkUnicoConfig = { modo_convite: 'link_unico', prazo_rsvp: '2026-10-31' } as any;
  const convite = { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2', tipo: 'individual', limite_pessoas: 1, nome_principal: 'João Silva' };

  beforeEach(() => {
    jest.clearAllMocks();
    (rsvpService.getRSVPConfig as jest.Mock).mockResolvedValue(null);
    (rsvpService.getInviteBySlug as jest.Mock).mockResolvedValue(convite);
    (rsvpService.getInviteMembers as jest.Mock).mockResolvedValue([
      { id: 'm1', nome: 'João Silva', confirmado: true, convite_id: 'c1' },
    ]);
    (rsvpService.getExistingRSVP as jest.Mock).mockResolvedValue(null);
  });

  it('mostra a caixa de acompanhante pelo nome, não o contador anônimo de pessoas extras', async () => {
    render(<RSVP inviteSlug="joao-silva-a1b2" config={linkUnicoConfig} />);

    await waitFor(() => expect(screen.getByText(/Vem mais alguém com você/i)).toBeInTheDocument());
    expect(screen.queryByText(/Gostaria de levar mais alguém não listado acima/i)).not.toBeInTheDocument();
  });

  it('um convite tradicional (sem link único) continua mostrando o contador anônimo', async () => {
    render(<RSVP inviteSlug="joao-silva-a1b2" config={{ prazo_rsvp: '2026-10-31' } as any} />);

    await waitFor(() => expect(screen.getByText(/Gostaria de levar mais alguém não listado acima/i)).toBeInTheDocument());
    expect(screen.queryByText(/Vem mais alguém com você/i)).not.toBeInTheDocument();
  });

  it('ao adicionar um acompanhante pelo nome e confirmar, envia como membro novo (sem id) e busca os membros atualizados', async () => {
    (rsvpService.submitFullRSVP as jest.Mock).mockResolvedValue({ success: true });
    // Segunda chamada de getInviteMembers (depois do submit) já retorna o novo membro com id real.
    (rsvpService.getInviteMembers as jest.Mock)
      .mockResolvedValueOnce([{ id: 'm1', nome: 'João Silva', confirmado: true, convite_id: 'c1' }])
      .mockResolvedValueOnce([
        { id: 'm1', nome: 'João Silva', confirmado: true, convite_id: 'c1' },
        { id: 'm2', nome: 'Maria Silva', confirmado: true, convite_id: 'c1' },
      ]);

    render(<RSVP inviteSlug="joao-silva-a1b2" config={linkUnicoConfig} />);
    await waitFor(() => expect(screen.getByText(/Vem mais alguém com você/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/\+ Adicionar acompanhante/i));
    fireEvent.change(screen.getByPlaceholderText(/Nome do acompanhante/i), { target: { value: 'Maria Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Presença/i }));

    await waitFor(() => expect(rsvpService.submitFullRSVP).toHaveBeenCalled());

    const [, membersPayload] = (rsvpService.submitFullRSVP as jest.Mock).mock.calls[0];
    expect(membersPayload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'm1', nome: 'João Silva' }),
        expect.objectContaining({ nome: 'Maria Silva', confirmado: true }),
      ])
    );
    // O acompanhante novo não deve carregar um `id` (senão viraria upsert em vez de insert).
    const novoMembro = membersPayload.find((m: any) => m.nome === 'Maria Silva');
    expect(novoMembro.id).toBeUndefined();

    // Busca os membros de novo do banco, pra pegar o id real do novo acompanhante.
    await waitFor(() => expect(rsvpService.getInviteMembers).toHaveBeenCalledTimes(2));
  });
});
