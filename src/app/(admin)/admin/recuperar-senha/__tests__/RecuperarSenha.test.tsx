import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecuperarSenhaPage from '../page';
import { authService } from '@/lib/services/authService';

jest.mock('@/lib/services/authService', () => ({
  authService: { requestPasswordReset: jest.fn() },
}));

describe('RecuperarSenhaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exibe o formulário de e-mail inicialmente', () => {
    render(<RecuperarSenhaPage />);
    expect(screen.getByText(/Esqueceu sua senha/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/E-mail/i)).toBeInTheDocument();
  });

  test('ao enviar, chama authService.requestPasswordReset e mostra confirmação', async () => {
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true });

    render(<RecuperarSenhaPage />);
    fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'afsb100@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de redefinição/i }));

    await waitFor(() => expect(screen.getByText(/Verifique seu e-mail/i)).toBeInTheDocument());
    expect(authService.requestPasswordReset).toHaveBeenCalledWith('afsb100@gmail.com');
    expect(screen.getByText(/afsb100@gmail.com/)).toBeInTheDocument();
  });

  test('mostra a mesma confirmação mesmo se o e-mail não existir (sem revelar isso ao usuário)', async () => {
    // O Supabase não diferencia "e-mail existe" de "não existe" — só
    // erros reais de serviço (rede etc.) devem gerar mensagem de erro.
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true });

    render(<RecuperarSenhaPage />);
    fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'naoexiste@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de redefinição/i }));

    await waitFor(() => expect(screen.getByText(/Verifique seu e-mail/i)).toBeInTheDocument());
  });

  test('mostra erro quando o serviço falha de verdade', async () => {
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue({
      success: false,
      error: new Error('Serviço indisponível'),
    });

    render(<RecuperarSenhaPage />);
    fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'x@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de redefinição/i }));

    await waitFor(() => expect(screen.getByText(/Serviço indisponível/i)).toBeInTheDocument());
    expect(screen.queryByText(/Verifique seu e-mail/i)).not.toBeInTheDocument();
  });

  test('tem um link de volta para o login', () => {
    render(<RecuperarSenhaPage />);
    expect(screen.getByText(/Voltar para o Login/i).closest('a')).toHaveAttribute('href', '/admin/login');
  });
});
