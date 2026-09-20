import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import PublicAutoCadastroPage from '../page';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

/**
 * Correção de 20/09/2026: esta página não mostra mais um formulário de
 * auto-identificação bloqueante — ela agora renderiza o MESMO convite
 * completo de /inv/[slug] (via <LiveInviteView>), e é o próprio <RSVP>
 * (prop `autoCadastro`) quem pede "quem é você" na hora de confirmar
 * presença. Ver src/components/sections/RSVP.tsx.
 */
jest.mock('@/lib/services/eventService', () => ({
  eventService: { getEventoBySlug: jest.fn() },
}));

jest.mock('@/components/public/LiveInviteView', () => (props: any) => (
  <div data-testid="live-invite-view">
    <span data-testid="autoCadastro">{JSON.stringify(props.autoCadastro)}</span>
    <span data-testid="couple">{`${props.couple.noiva} & ${props.couple.noivo}`}</span>
  </div>
));

const mockReplace = jest.fn();

const baseEvento = { id: 'e1', slug: 'casamento-ana-carlos', nome: 'Casamento' };
const linkUnicoConfig = {
  evento_id: 'e1',
  noiva_nome: 'Ana',
  noivo_nome: 'Carlos',
  data_casamento: '2026-10-10',
  modo_convite: 'link_unico',
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
};

function mockSupabaseTables(configData: any) {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((fn: any) => Promise.resolve(fn({ data: [], error: null }))),
    };
    if (table === 'configuracoes') {
      chain.maybeSingle.mockResolvedValue({ data: configData, error: null });
    }
    return chain;
  });
}

describe('PublicAutoCadastroPage (Link Único)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useParams as jest.Mock).mockReturnValue({ eventoSlug: 'casamento-ana-carlos' });
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn() });
  });

  it('mostra "convite não encontrado" para um slug de evento inválido', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(null);
    mockSupabaseTables(null);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
  });

  it('mostra "convite não encontrado" se o evento não estiver mais no modo Link Único', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    mockSupabaseTables({ ...linkUnicoConfig, modo_convite: 'individual' });

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByText(/Convite não encontrado/i)).toBeInTheDocument());
  });

  it('redireciona direto para /inv/[slug] se já existe convite salvo no navegador', async () => {
    localStorage.setItem('link_unico_convite_casamento-ana-carlos', JSON.stringify({ slug: 'joao-silva-a1b2' }));
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    mockSupabaseTables(linkUnicoConfig);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/inv/joao-silva-a1b2'));
  });

  it('renderiza o convite completo (LiveInviteView) com autoCadastro na primeira visita, sem gate bloqueante', async () => {
    (eventService.getEventoBySlug as jest.Mock).mockResolvedValue(baseEvento);
    mockSupabaseTables(linkUnicoConfig);

    render(<PublicAutoCadastroPage />);

    await waitFor(() => expect(screen.getByTestId('live-invite-view')).toBeInTheDocument());
    expect(screen.getByTestId('couple')).toHaveTextContent('Ana & Carlos');
    expect(JSON.parse(screen.getByTestId('autoCadastro').textContent!)).toEqual({
      eventoId: 'e1',
      eventoSlug: 'casamento-ana-carlos',
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
