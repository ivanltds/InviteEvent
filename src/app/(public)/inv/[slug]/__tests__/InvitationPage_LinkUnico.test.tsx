import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import InvitationPageClient from '../InvitationPageClient';
import { supabase } from '@/lib/supabase';
import { saveConvite, getSavedConvite } from '@/lib/utils/linkUnico';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

/**
 * Pedido do usuário em 20/09/2026:
 * 1) "quando abro o convite 2 vezes, na segunda dá convite não
 *    encontrado pois ele foi excluído da lista. isso deveria zerar ele
 *    pra mim." — o convite salvo (Link Único) no localStorage foi
 *    excluído do banco; o dispositivo ficava preso pra sempre apontando
 *    pro mesmo slug morto.
 * 2) "uma pessoa pedir para aceitar o dela pelo mesmo celular que
 *    aceitou o seu" — uma segunda pessoa no mesmo dispositivo precisa
 *    poder confirmar a presença dela separadamente.
 */
jest.mock('@/components/ui/HeroCarousel', () => () => <div data-testid="carousel" />);
jest.mock('@/components/sections/RSVP', () => () => <div data-testid="rsvp" />);
jest.mock('@/components/sections/Countdown', () => () => <div data-testid="countdown" />);

function mockSupabaseTables({ convite, config }: { convite: any; config: any }) {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((fn: any) => Promise.resolve(fn({ data: [], error: null }))),
    };
    if (table === 'convites') chain.maybeSingle.mockResolvedValue({ data: convite, error: null });
    if (table === 'configuracoes') chain.maybeSingle.mockResolvedValue({ data: config, error: null });
    return chain;
  });
}

const linkUnicoConfig = {
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  data_casamento: '2026-06-13',
  modo_convite: 'link_unico',
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
};

describe('InvitationPageClient — recuperação de convite salvo (Link Único)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() });
  });

  it('convite excluído com vínculo salvo no dispositivo: zera o vínculo e oferece cadastrar de novo', async () => {
    saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
    mockSupabaseTables({ convite: null, config: null }); // convite não existe mais

    render(<InvitationPageClient slug="joao-silva-a1b2" />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
    expect(screen.getByText(/não está mais disponível/i)).toBeInTheDocument();
    expect(screen.getByText(/Cadastrar presença novamente/i).closest('a')).toHaveAttribute(
      'href',
      '/inv/evento/casamento-ana-carlos'
    );

    // O vínculo salvo foi zerado — o dispositivo não fica mais preso a esse slug morto.
    expect(getSavedConvite('casamento-ana-carlos')).toBeNull();
  });

  it('convite excluído SEM vínculo salvo no dispositivo: mostra a mensagem genérica de sempre', async () => {
    mockSupabaseTables({ convite: null, config: null });

    render(<InvitationPageClient slug="slug-qualquer" />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
    expect(screen.getByText(/verifique o link enviado pelos noivos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cadastrar presença novamente/i)).not.toBeInTheDocument();
  });

  it('convite Link Único existente com vínculo salvo: mostra o banner "não é você?"', async () => {
    saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
    localStorage.setItem('envelope_views_joao-silva-a1b2', '3'); // pula a animação do envelope
    mockSupabaseTables({
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2' },
      config: linkUnicoConfig,
    });

    render(<InvitationPageClient slug="joao-silva-a1b2" />);

    await waitFor(() => expect(screen.getByText(/Ana & Carlos/i)).toBeInTheDocument());
    expect(screen.getByText(/Não é você\? Confirme sua presença separadamente/i)).toBeInTheDocument();
  });

  it('clicar em "não é você?" limpa o vínculo salvo deste evento', async () => {
    saveConvite('casamento-ana-carlos', 'joao-silva-a1b2');
    localStorage.setItem('envelope_views_joao-silva-a1b2', '3');
    mockSupabaseTables({
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2' },
      config: linkUnicoConfig,
    });

    render(<InvitationPageClient slug="joao-silva-a1b2" />);
    await waitFor(() => expect(screen.getByText(/Não é você\?/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Não é você\? Confirme sua presença separadamente/i));

    expect(getSavedConvite('casamento-ana-carlos')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/inv/evento/casamento-ana-carlos');
  });

  it('convite tradicional (não Link Único): não mostra o banner "não é você?"', async () => {
    localStorage.setItem('envelope_views_joao-silva-a1b2', '3');
    mockSupabaseTables({
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2' },
      config: { ...linkUnicoConfig, modo_convite: 'individual' },
    });

    render(<InvitationPageClient slug="joao-silva-a1b2" />);

    await waitFor(() => expect(screen.getByText(/Ana & Carlos/i)).toBeInTheDocument());
    expect(screen.queryByText(/Não é você\?/i)).not.toBeInTheDocument();
  });
});
