import { supabase } from '@/lib/supabase';

export const authService = {
  /**
   * Realiza login via Supabase Auth e gerencia a sessão server-side via proxy de API.
   *
   * `captchaToken`: o projeto tem "Enable Captcha protection" (hCaptcha)
   * ligado no Supabase Auth — sem esse token a chamada é rejeitada com
   * "captcha protection: request disallowed". Ver HCaptchaGate.tsx.
   */
  async login(email: string, password?: string, captchaToken?: string): Promise<void> {
    // 1. Autenticação no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error) {
      console.error('Erro Supabase Auth:', error.message);
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Falha ao obter sessão do usuário.');
    }

    // 2. Proxy de Sessão (Server-side Cookies):
    // Enviamos o token para uma API Route para que ela defina o cookie HTTP-only
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: data.session.access_token })
    });

    if (!response.ok) {
      throw new Error('Falha ao sincronizar sessão com o servidor.');
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/admin/login';
  },

  /**
   * Dispara o e-mail de redefinição de senha do Supabase Auth. O link
   * enviado traz o usuário de volta pra /admin/redefinir-senha com uma
   * sessão de recuperação temporária (o client do Supabase detecta o
   * token no fragmento da URL automaticamente).
   *
   * Não diferenciamos "e-mail existe" de "e-mail não existe" na resposta
   * — nem o Supabase faz isso por padrão — pra não expor quais e-mails
   * têm conta cadastrada (user enumeration).
   *
   * O redirect usa NEXT_PUBLIC_SITE_URL quando definida (mesmo padrão de
   * src/app/api/checkout/route.ts) em vez de window.location.origin, pra
   * sempre apontar pro domínio canônico de produção — independente de o
   * usuário ter acessado por um preview da Vercel ou outra variante de
   * origin. Isso reduz a allow-list de redirect URLs do Supabase a uma
   * única URL fixa. Em dev local (sem a env var), cai no origin atual.
   *
   * `captchaToken`: mesma exigência do login — ver HCaptchaGate.tsx.
   */
  async requestPasswordReset(email: string, captchaToken?: string): Promise<{ success: boolean; error?: Error | null }> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const redirectTo = siteUrl ? `${siteUrl}/admin/redefinir-senha` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo, captchaToken });
    return { success: !error, error: error ? new Error(error.message) : null };
  },

  /**
   * Define uma nova senha para o usuário da sessão de recuperação ativa
   * (só funciona logo após clicar no link do e-mail de redefinição).
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: Error | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error: error ? new Error(error.message) : null };
  }
};
