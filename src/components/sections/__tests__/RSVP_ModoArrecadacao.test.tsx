import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

/**
 * Pedido do usuário em 20/09/2026: "quando tiver escolhido a gravata, ao
 * confirmar presença não deve mostrar lista de presentes." O link de
 * "Ver Lista de Presentes" nas telas de sucesso do RSVP agora respeita
 * config.modo_arrecadacao, igual o botão do hero em LiveInviteView.
 */
jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

const baseConvite = { id: 'c1', nome_principal: 'João', slug: 'joao-silva', evento_id: 'e1', tipo: 'individual', limite_pessoas: 1 };

function mockSupabase({ convite = baseConvite, existingRSVP = null }: { convite?: any; existingRSVP?: any } = {}) {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((fn: any) => Promise.resolve(fn({ data: [], error: null }))),
    };
    if (table === 'eventos_config') {
      chain.maybeSingle.mockResolvedValue({ data: { prazo_rsvp: '2026-12-31' }, error: null });
    } else if (table === 'convites') {
      chain.maybeSingle.mockResolvedValue({ data: convite, error: null });
    } else if (table === 'convite_membros') {
      chain.order.mockResolvedValue({ data: [], error: null });
    } else if (table === 'rsvp') {
      chain.maybeSingle.mockResolvedValue({ data: existingRSVP, error: null });
    }
    return chain;
  });
}

describe('RSVP — link pós-confirmação respeita modo_arrecadacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'joao-silva' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue('joao-silva') });
  });

  it('mostra "Ver Lista de Presentes" quando modo_arrecadacao é presentes (ou ausente)', async () => {
    mockSupabase();
    render(<RSVP inviteSlug="joao-silva" config={{ modo_arrecadacao: 'presentes' } as any} />);
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Confirmar Presença'));

    await waitFor(() => expect(screen.getByText(/Ver Lista de Presentes/i)).toBeInTheDocument());
  });

  it('NÃO mostra "Ver Lista de Presentes" quando modo_arrecadacao é gravata, mostra o botão da Gravata', async () => {
    mockSupabase();
    render(
      <RSVP
        inviteSlug="joao-silva"
        config={{ modo_arrecadacao: 'gravata', gravata_label: 'quero_presentear' } as any}
      />
    );
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Confirmar Presença'));

    await waitFor(() => expect(screen.getByText('Quero presentear').closest('a')).toHaveAttribute('href', '/inv/joao-silva/gravata'));
    expect(screen.queryByText(/Ver Lista de Presentes/i)).not.toBeInTheDocument();
  });

  it('NÃO mostra nenhum botão de arrecadação quando modo_arrecadacao é nenhum', async () => {
    mockSupabase();
    render(<RSVP inviteSlug="joao-silva" config={{ modo_arrecadacao: 'nenhum' } as any} />);
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Confirmar Presença'));

    await waitFor(() => expect(screen.getByText(/presença está confirmada/i)).toBeInTheDocument());
    expect(screen.queryByText(/Ver Lista de Presentes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quero/i)).not.toBeInTheDocument();
  });

  it('convidado que retorna já confirmado (modo gravata) também não vê lista de presentes', async () => {
    mockSupabase({ existingRSVP: { status: 'confirmado', confirmados: 1 } });
    render(<RSVP inviteSlug="joao-silva" config={{ modo_arrecadacao: 'gravata' } as any} />);

    await waitFor(() => expect(screen.getByText(/já está confirmada/i)).toBeInTheDocument());
    expect(screen.queryByText(/Ver Lista de Presentes/i)).not.toBeInTheDocument();
    expect(screen.getByText('Quero colaborar').closest('a')).toHaveAttribute('href', '/inv/joao-silva/gravata');
  });
});
