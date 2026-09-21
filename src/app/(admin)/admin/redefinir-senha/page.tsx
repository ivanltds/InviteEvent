'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin.module.css';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/authService';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Fluxo de recuperação de senha (Fase 2: definir a nova senha).
 * Aberta a partir do link enviado por /admin/recuperar-senha — o client
 * do Supabase detecta o token de recuperação no fragmento da URL
 * automaticamente e dispara o evento PASSWORD_RECOVERY, estabelecendo
 * uma sessão temporária só pra essa troca de senha.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verificando' | 'pronto' | 'invalido' | 'sucesso'>('verificando');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se o link já veio com uma sessão de recuperação válida, o Supabase
    // pode disparar PASSWORD_RECOVERY antes deste listener ser registrado
    // — por isso também checamos getSession() direto, como fallback.
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true;
        setStatus('pronto');
      }
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!resolved && data.session) {
        resolved = true;
        setStatus('pronto');
      } else if (!resolved) {
        // Dá um tempo curto pro evento PASSWORD_RECOVERY chegar antes de
        // desistir — o parsing do fragmento da URL é assíncrono.
        setTimeout(() => {
          if (!resolved) setStatus('invalido');
        }, 2500);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { success, error: updateError } = await authService.updatePassword(password);

    if (!success) {
      setLoading(false);
      setError(updateError?.message || 'Não foi possível redefinir sua senha. Tente novamente.');
      return;
    }

    // Sincroniza a sessão (já autenticada após a troca) com o cookie do
    // servidor, igual ao fluxo de login normal, pra já entrar direto.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: sessionData.session.access_token }),
        });
      }
    } catch {
      // Não bloqueia o sucesso da troca de senha se a sincronização falhar
      // — o usuário ainda pode logar normalmente em seguida.
    }

    setLoading(false);
    setStatus('sucesso');
  };

  if (status === 'verificando') {
    return (
      <main className={styles.loginContainer}>
        <div className={styles.loginForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p>Verificando seu link...</p>
        </div>
      </main>
    );
  }

  if (status === 'invalido') {
    return (
      <main className={styles.loginContainer}>
        <div className={styles.loginForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
          <h2 className="cursive" style={{ fontSize: '1.8rem' }}>Link inválido ou expirado</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Esse link de redefinição de senha não é mais válido. Solicite um novo.
          </p>
          <Link href="/admin/recuperar-senha" className={styles.loginBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
            Solicitar novo link
          </Link>
        </div>
      </main>
    );
  }

  if (status === 'sucesso') {
    return (
      <main className={styles.loginContainer}>
        <div className={styles.loginForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
          <h2 className="cursive" style={{ fontSize: '1.8rem' }}>Senha redefinida!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Sua senha foi alterada com sucesso.
          </p>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={() => { router.push('/admin/dashboard'); router.refresh(); }}
          >
            Ir para o Painel
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className="cursive">Nova senha</h2>
        <p>Escolha uma nova senha para sua conta.</p>

        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
          placeholder="Nova senha (mínimo 6 caracteres)"
          className={styles.input}
          required
          minLength={6}
          disabled={loading}
          autoFocus
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); if (error) setError(''); }}
          placeholder="Confirme a nova senha"
          className={styles.input}
          required
          minLength={6}
          disabled={loading}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </main>
  );
}
