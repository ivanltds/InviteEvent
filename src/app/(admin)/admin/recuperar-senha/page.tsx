'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { authService } from '@/lib/services/authService';
import HCaptchaGate, { HCaptchaGateHandle, isHCaptchaEnabled } from '@/components/shared/HCaptchaGate';

/**
 * Fluxo de recuperação de senha (Fase 1: solicitar o e-mail).
 * Pedido do usuário em 20/09/2026 (via afsb100@gmail.com, que perdeu a
 * senha e não tinha como recuperar): "Use o maestro pra fazer a
 * recuperação de senha."
 *
 * Fase 2 fica em /admin/redefinir-senha, aberta a partir do link que o
 * Supabase Auth envia por e-mail.
 */

// Cooldown client-side entre pedidos de reset. Não é a defesa real contra
// abuso (isso é o rate limit nativo do Supabase Auth, ver
// docs/deploys/checklist-supabase-auth-redirect-urls.md) — é só pra evitar
// double-submit/spam de clique e dar um feedback claro ao usuário. Guardado
// em localStorage pra sobreviver a reload.
const COOLDOWN_MS = 60_000;
const COOLDOWN_STORAGE_KEY = 'reset_pw_cooldown_until';

function readCooldownRemaining(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const until = Number(window.localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0);
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptchaGateHandle>(null);

  // Ao montar, verifica se ainda há um cooldown ativo de um envio anterior
  // (sobrevive a reload/nova visita à página). Não dá pra ler isso via lazy
  // initial state porque localStorage não existe durante o SSR — inicializar
  // com 0 e corrigir no client evita mismatch de hidratação.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura de localStorage é client-only por natureza; não há como sincronizar isso fora de um efeito sem quebrar a hidratação.
    setCooldownMs(readCooldownRemaining());
  }, []);

  // Contagem regressiva enquanto o cooldown estiver ativo.
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const interval = setInterval(() => {
      const remaining = readCooldownRemaining();
      setCooldownMs(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownMs > 0) return;

    if (isHCaptchaEnabled() && !captchaToken) {
      setError('Confirme que você não é um robô antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');

    const { success, error: reqError } = await authService.requestPasswordReset(email.trim(), captchaToken || undefined);
    setLoading(false);

    if (!success) {
      // Erros aqui são de rede/serviço indisponível, não de "e-mail não
      // encontrado" — o Supabase não revela isso, de propósito.
      setError(reqError?.message || 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
      // Token de captcha é de uso único — reseta pra permitir nova tentativa.
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      return;
    }

    try {
      window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now() + COOLDOWN_MS));
    } catch {
      // localStorage indisponível (modo privado etc.) — cooldown vira só
      // client-side em memória pra essa sessão, sem quebrar o fluxo.
    }
    setCooldownMs(COOLDOWN_MS);
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

        <HCaptchaGate ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.loginBtn} disabled={loading || cooldownMs > 0 || (isHCaptchaEnabled() && !captchaToken)}>
          {loading
            ? 'Enviando...'
            : cooldownMs > 0
              ? `Aguarde ${Math.ceil(cooldownMs / 1000)}s para tentar novamente`
              : 'Enviar link de redefinição'}
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
