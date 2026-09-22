import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecuperarSenhaPage from '../page';
import { authService } from '@/lib/services/authService';

jest.mock('@/lib/services/authService', () => ({
  authService: { requestPasswordReset: jest.fn() },
}));

describe('RecuperarSenhaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
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
    expect(authService.requestPasswordReset).toHaveBeenCalledWith('afsb100@gmail.com', undefined);
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

  test('aplica cooldown após envio bem-sucedido, persistido em localStorage', async () => {
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true });

    render(<RecuperarSenhaPage />);
    fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'afsb100@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de redefinição/i }));

    await waitFor(() => expect(screen.getByText(/Verifique seu e-mail/i)).toBeInTheDocument());
    expect(Number(window.localStorage.getItem('reset_pw_cooldown_until'))).toBeGreaterThan(Date.now());
  });

  test('desabilita o botão com contagem regressiva quando reaberta durante o cooldown', () => {
    window.localStorage.setItem('reset_pw_cooldown_until', String(Date.now() + 45_000));

    render(<RecuperarSenhaPage />);

    const button = screen.getByRole('button', { name: /Aguarde \d+s para tentar novamente/i });
    expect(button).toBeDisabled();
  });

  test('não chama requestPasswordReset se o cooldown ainda estiver ativo', () => {
    window.localStorage.setItem('reset_pw_cooldown_until', String(Date.now() + 45_000));

    render(<RecuperarSenhaPage />);
    fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'x@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Aguarde \d+s para tentar novamente/i }));

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
  });

  describe('com hCaptcha habilitado (NEXT_PUBLIC_HCAPTCHA_SITE_KEY definida)', () => {
    const originalSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY = 'test-site-key';
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY = originalSiteKey;
    });

    test('bloqueia o envio até o captcha ser verificado', () => {
      render(<RecuperarSenhaPage />);
      const button = screen.getByRole('button', { name: /Enviar link de redefinição/i });

      fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'afsb100@gmail.com' } });
      expect(button).toBeDisabled();

      fireEvent.click(screen.getByTestId('hcaptcha-mock-verify'));
      expect(button).not.toBeDisabled();
    });

    test('envia o captchaToken pro authService.requestPasswordReset depois de verificado', async () => {
      (authService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true });
      render(<RecuperarSenhaPage />);

      fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'afsb100@gmail.com' } });
      fireEvent.click(screen.getByTestId('hcaptcha-mock-verify'));
      fireEvent.click(screen.getByRole('button', { name: /Enviar link de redefinição/i }));

      await waitFor(() => {
        expect(authService.requestPasswordReset).toHaveBeenCalledWith('afsb100@gmail.com', 'test-captcha-token');
      });
    });
  });
});
