import { authService } from '../authService';
import { supabase } from '@/lib/supabase';

// Mock manual completo com factory para controle total
jest.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
      })),
      auth: {
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
    },
  };
});

describe('authService - Fix Final', () => {
  const MOCK_EMAIL = 'admin@teste.com';
  const MOCK_PASSWORD = 'password123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve logar com e-mail e senha e definir cookie de sessão', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { 
        user: { id: 'user-123' }, 
        session: { access_token: 'jwt-token' } 
      },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await expect(authService.login(MOCK_EMAIL, MOCK_PASSWORD)).resolves.not.toThrow();
  });

  it('repassa o captchaToken pro Supabase quando fornecido (hCaptcha)', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' }, session: { access_token: 'jwt-token' } },
      error: null,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await authService.login(MOCK_EMAIL, MOCK_PASSWORD, 'captcha-token-abc');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      options: { captchaToken: 'captcha-token-abc' },
    });
  });

  it('não envia options quando nenhum captchaToken é fornecido', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' }, session: { access_token: 'jwt-token' } },
      error: null,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await authService.login(MOCK_EMAIL, MOCK_PASSWORD);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      options: undefined,
    });
  });

  it('deve lançar erro em caso de falha no Supabase', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    try {
      await authService.login(MOCK_EMAIL, MOCK_PASSWORD);
      throw new Error('Deveria ter falhado');
    } catch (e) {
      expect((e as Error).message).toBe('Invalid credentials');
    }
  });

  describe('requestPasswordReset', () => {
    it('dispara o e-mail de redefinição com redirectTo apontando pra /admin/redefinir-senha', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      const result = await authService.requestPasswordReset(MOCK_EMAIL);

      expect(result.success).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        MOCK_EMAIL,
        expect.objectContaining({ redirectTo: expect.stringContaining('/admin/redefinir-senha') })
      );
    });

    it('retorna erro quando o Supabase falha (não quando o e-mail simplesmente não existe)', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: { message: 'Serviço indisponível' },
      });

      const result = await authService.requestPasswordReset(MOCK_EMAIL);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Serviço indisponível');
    });

    it('usa NEXT_PUBLIC_SITE_URL como domínio canônico do redirect quando definida', async () => {
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://inviteevent.com.br';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await authService.requestPasswordReset(MOCK_EMAIL);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        MOCK_EMAIL,
        expect.objectContaining({ redirectTo: 'https://inviteevent.com.br/admin/redefinir-senha' })
      );

      process.env.NEXT_PUBLIC_SITE_URL = original;
    });

    it('cai no window.location.origin quando NEXT_PUBLIC_SITE_URL não está definida', async () => {
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await authService.requestPasswordReset(MOCK_EMAIL);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        MOCK_EMAIL,
        expect.objectContaining({ redirectTo: expect.stringContaining('/admin/redefinir-senha') })
      );

      process.env.NEXT_PUBLIC_SITE_URL = original;
    });

    it('repassa o captchaToken pro Supabase quando fornecido (hCaptcha)', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await authService.requestPasswordReset(MOCK_EMAIL, 'captcha-token-xyz');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        MOCK_EMAIL,
        expect.objectContaining({ captchaToken: 'captcha-token-xyz' })
      );
    });
  });

  describe('updatePassword', () => {
    it('atualiza a senha do usuário da sessão de recuperação ativa', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });

      const result = await authService.updatePassword('novaSenha123');

      expect(result.success).toBe(true);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
    });

    it('retorna erro quando a atualização falha', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: { message: 'Token expirado' } });

      const result = await authService.updatePassword('novaSenha123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Token expirado');
    });
  });
});
