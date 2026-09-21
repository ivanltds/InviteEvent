import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RedefinirSenhaPage from '../page';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/services/authService', () => ({
  authService: { updatePassword: jest.fn() },
}));

let authCallback: ((event: string, session: any) => void) | null = null;

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  },
}));

describe('RedefinirSenhaPage', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  test('mostra "Verificando..." enquanto checa a sessão de recuperação', async () => {
    (supabase.auth.getSession as jest.Mock).mockReturnValue(new Promise(() => {})); // nunca resolve
    render(<RedefinirSenhaPage />);
    expect(screen.getByText(/Verificando seu link/i)).toBeInTheDocument();
  });

  test('mostra o formulário quando getSession já retorna uma sessão ativa', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { access_token: 't1' } } });
    render(<RedefinirSenhaPage />);
    await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());
  });

  test('mostra o formulário quando o evento PASSWORD_RECOVERY dispara', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    render(<RedefinirSenhaPage />);

    await act(async () => {
      authCallback?.('PASSWORD_RECOVERY', { access_token: 't1' });
    });

    await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());
  });

  test('mostra "link inválido" se nenhuma sessão de recuperação aparecer a tempo', async () => {
    jest.useFakeTimers();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    render(<RedefinirSenhaPage />);

    // Deixa a promise do getSession() (microtask) resolver e o setTimeout
    // de fato ser agendado antes de avançar os fake timers.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    expect(screen.getByText(/Link inválido ou expirado/i)).toBeInTheDocument();
    jest.useRealTimers();
  });

  describe('com sessão de recuperação válida', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { access_token: 't1' } } });
    });

    test('valida tamanho mínimo da senha', async () => {
      render(<RedefinirSenhaPage />);
      await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText(/^Nova senha/i), { target: { value: '123' } });
      fireEvent.change(screen.getByPlaceholderText(/Confirme a nova senha/i), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /Redefinir senha/i }));

      expect(screen.getByText(/pelo menos 6 caracteres/i)).toBeInTheDocument();
      expect(authService.updatePassword).not.toHaveBeenCalled();
    });

    test('valida que as senhas coincidem', async () => {
      render(<RedefinirSenhaPage />);
      await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText(/^Nova senha/i), { target: { value: 'senha123' } });
      fireEvent.change(screen.getByPlaceholderText(/Confirme a nova senha/i), { target: { value: 'outrasenha' } });
      fireEvent.click(screen.getByRole('button', { name: /Redefinir senha/i }));

      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
      expect(authService.updatePassword).not.toHaveBeenCalled();
    });

    test('ao redefinir com sucesso, sincroniza a sessão e mostra confirmação', async () => {
      (authService.updatePassword as jest.Mock).mockResolvedValue({ success: true });

      render(<RedefinirSenhaPage />);
      await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText(/^Nova senha/i), { target: { value: 'senha123' } });
      fireEvent.change(screen.getByPlaceholderText(/Confirme a nova senha/i), { target: { value: 'senha123' } });
      fireEvent.click(screen.getByRole('button', { name: /Redefinir senha/i }));

      await waitFor(() => expect(screen.getByText(/Senha redefinida/i)).toBeInTheDocument());
      expect(authService.updatePassword).toHaveBeenCalledWith('senha123');
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({ method: 'POST' }));
    });

    test('mostra erro quando updatePassword falha', async () => {
      (authService.updatePassword as jest.Mock).mockResolvedValue({ success: false, error: new Error('Token expirado') });

      render(<RedefinirSenhaPage />);
      await waitFor(() => expect(screen.getByText(/^Nova senha$/i)).toBeInTheDocument());

      fireEvent.change(screen.getByPlaceholderText(/^Nova senha/i), { target: { value: 'senha123' } });
      fireEvent.change(screen.getByPlaceholderText(/Confirme a nova senha/i), { target: { value: 'senha123' } });
      fireEvent.click(screen.getByRole('button', { name: /Redefinir senha/i }));

      await waitFor(() => expect(screen.getByText(/Token expirado/i)).toBeInTheDocument());
      expect(screen.queryByText(/Senha redefinida/i)).not.toBeInTheDocument();
    });
  });
});
