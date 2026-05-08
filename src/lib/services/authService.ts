import { supabase } from '@/lib/supabase';

export const authService = {
  /**
   * Realiza login via Supabase Auth e gerencia a sessão server-side via proxy de API.
   */
  async login(email: string, password?: string): Promise<void> {
    // 1. Autenticação no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || ''
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
  }
};
