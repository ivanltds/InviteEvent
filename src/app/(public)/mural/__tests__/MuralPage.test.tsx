import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuralPage from '../page';
import { supabase } from '@/lib/supabase';

/**
 * Pedido do usuário em 20/09/2026: Mural de Lembranças é opcional — quando
 * desativado nas configurações (`mostrar_mural: false`), o acesso direto
 * pela URL /mural também deve ser bloqueado, não só o botão escondido no
 * convite.
 */
jest.mock('@/components/sections/MuralSection', () => () => <div data-testid="mural-section">Mural</div>);

describe('MuralPage — mural desativado bloqueia acesso direto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '?invite=joao-silva-a1b2');
  });

  function mockSupabaseTables({ convite, config }: { convite: any; config: any }) {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      if (table === 'convites') chain.maybeSingle.mockResolvedValue({ data: convite, error: null });
      if (table === 'configuracoes') chain.maybeSingle.mockResolvedValue({ data: config, error: null });
      return chain;
    });
  }

  it('mostra o mural normalmente quando mostrar_mural é true (ou ausente)', async () => {
    mockSupabaseTables({
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2' },
      config: { evento_id: 'e1', mostrar_mural: true },
    });

    render(<MuralPage />);

    await waitFor(() => expect(screen.getByTestId('mural-section')).toBeInTheDocument());
  });

  it('bloqueia o acesso quando mostrar_mural é false', async () => {
    mockSupabaseTables({
      convite: { id: 'c1', evento_id: 'e1', slug: 'joao-silva-a1b2' },
      config: { evento_id: 'e1', mostrar_mural: false },
    });

    render(<MuralPage />);

    await waitFor(() => expect(screen.getByText(/Mural Indisponível/i)).toBeInTheDocument());
    expect(screen.queryByTestId('mural-section')).not.toBeInTheDocument();
  });
});
