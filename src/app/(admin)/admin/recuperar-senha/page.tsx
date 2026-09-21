'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { authService } from '@/lib/services/authService';

/**
 * Fluxo de recuperação de senha (Fase 1: solicitar o e-mail).
 * Pedido do usuário em 20/09/2026 (via afsb100@gmail.com, que perdeu a
 * senha e não tinha como recuperar): "Use o maestro pra fazer a
 * recuperação de senha."
 *
 * Fase 2 fica em /admin/redefinir-senha, aberta a partir do link que o
 * Supabase Auth envia por e-mail.
 */
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { success, error: reqError } = await authService.requestPasswordReset(email.trim());
    setLoading(false);

    if (!success) {
      // Erros aqui são de rede/serviço indisponível, não de "e-mail não
      // encontrado" — o Supabase não revela isso, de propósito.
      setError(reqError?.message || 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
      return;
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <main className={styles.loginContainer}>
        <div className={styles.loginForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
          <h2 className="cursive" style={{ fontSize: '1.8rem' }}>Verifique seu e-mail</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Se houver uma conta cadastrada com <strong>{email}</strong>, enviamos um link para redefinir sua senha.
          </p>
          <Link href="/admin/login" className={styles.loginBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
            Voltar para o Login
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem' }}>
            Dica: verifique sua caixa de spam se não encontrar o e-mail em alguns minutos.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className="cursive">Esqueceu sua senha?</h2>
        <p>Digite seu e-mail e enviaremos um link para você criar uma nova senha.</p>

        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
          placeholder="E-mail"
          className={styles.input}
          required
          disabled={loading}
          autoFocus
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link de redefinição'}
        </button>

        <Link
          href="/admin/login"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '1rem',
            color: '#C5A059',
            textDecoration: 'underline',
            fontSize: '0.9rem',
          }}
        >
          Voltar para o Login
        </Link>
      </form>
    </main>
  );
}
