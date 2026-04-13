'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase';

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

/**
 * Transfere o pending_invite_state do localStorage para o Supabase.
 * Chamada após a sessão estar confirmada (onAuthStateChange SIGNED_IN).
 */
async function claimPendingInvite() {
  const rawPayload = localStorage.getItem('pending_invite_state');
  if (!rawPayload) return;

  try {
    const payload = JSON.parse(rawPayload);
    const { eventService } = await import('@/lib/services/eventService');

    const nomeCasamento = `Casamento de ${payload.noiva_nome} e ${payload.noivo_nome}`;
    const res = await eventService.createEvent(nomeCasamento);

    if (res.data && !res.error) {
      // Atualizar config com os dados do onboarding
      const { error: cfgErr } = await supabase.from('configuracoes').update({
        noiva_nome: payload.noiva_nome,
        noivo_nome: payload.noivo_nome,
        data_casamento: payload.data_evento || '2027-10-10',
        bg_primary: payload.bg_primary || null,
        accent_color: payload.accent_color || null,
        font_cursive: payload.font_cursive || null,
        font_serif: payload.font_serif || null,
        ...(payload.cover_image_url ? { fotos: [payload.cover_image_url] } : {})
      }).eq('evento_id', res.data.id);

      if (cfgErr) {
        console.warn('[claimPendingInvite] Erro ao atualizar config:', cfgErr.message);
      }

      // Marcar onboarding como concluído para o dashboard não mostrar o wizard interno
      await supabase.from('eventos').update({ onboarding_completed: true }).eq('id', res.data.id);

      localStorage.removeItem('pending_invite_state');
      alert(`🎉 Eba! Seu convite foi salvo com sucesso em: inv/${res.data.slug}`);
      console.log('[claimPendingInvite] Convite offline transferido com sucesso:', res.data.id);
    } else {
      const errorMsg = res.error?.message || 'Erro desconhecido';
      alert(`⚠️ Não conseguimos salvar seu convite automaticamente: ${errorMsg}. Você pode criá-lo manualmente no Painel.`);
      console.warn('[claimPendingInvite] Falha ao criar evento:', errorMsg);
    }
  } catch (e) {
    console.error('[claimPendingInvite] Erro inesperado:', e);
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfirmationSent, setShowConfirmationSent] = useState(false);
  const router = useRouter();

  /**
   * Ouvir o evento de autenticação do Supabase.
   * Isso é a forma mais confiável de detectar quando o usuário está logado,
   * mesmo quando o signUp exige confirmação de email (caso a confirmação seja
   * desabilitada no Supabase, o evento SIGNED_IN dispara imediatamente).
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Atualizar perfil com campos do cadastro, se existirem no sessionStorage
        const pendingProfile = sessionStorage.getItem('pending_profile');
        if (pendingProfile) {
          try {
            const profile = JSON.parse(pendingProfile);
            await supabase.from('perfis').update({
              nome: profile.nome || null,
              cpf: profile.cpf || null,
              telefone: profile.telefone || null,
            }).eq('id', session.user.id);
            sessionStorage.removeItem('pending_profile');
          } catch { /* ignore */ }
        }

        // Transferir convite offline → online
        await claimPendingInvite();

        router.push('/admin/dashboard');
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Salvar temporariamente dados do perfil para o onAuthStateChange usar
        sessionStorage.setItem('pending_profile', JSON.stringify({
          nome: nome.trim(),
          cpf: cpf.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
        }));

        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          sessionStorage.removeItem('pending_profile');
          throw signUpError;
        }

        // Se o Supabase exigir confirmação de email, o onAuthStateChange não
        // vai disparar agora — então informamos o usuário.
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          // Email confirmation required
          setError('');
          setShowConfirmationSent(true);
          setLoading(false);
          return;
        }
        // Se já tem sessão (confirmação desabilida), o onAuthStateChange vai redirecionar.

      } else {
        const success = await authService.login(email, password);
        if (!success) {
          setError('E-mail ou senha incorretos.');
        }
        // Se login OK, o onAuthStateChange vai cuidar do redirect e claim.
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmationSent) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
          <h2 className="cursive" style={{ fontSize: '1.8rem' }}>Quase lá!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
            Enviamos um link de confirmação para <strong>{email}</strong>.<br/><br/>
            Assim que você confirmar seu e-mail, seu casamento será criado automaticamente com todas as personalizações que você escolheu!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => { setShowConfirmationSent(false); setIsSignUp(false); }}
              className={styles.loginBtn}
              style={{ background: '#f1f5f9', color: '#475569' }}
            >
              Voltar para o Login
            </button>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem' }}>
              Dica: Verifique sua caixa de spam se não encontrar o e-mail em alguns minutos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className="cursive">{isSignUp ? 'Criar Conta' : 'Acesso Organizador'}</h2>
        <p>
          {isSignUp
            ? 'Crie sua conta para gerenciar seu evento.'
            : 'Entre com seu e-mail e senha cadastrados.'}
        </p>

        {isSignUp && (
          <>
            <input
              type="text"
              value={nome}
              onChange={e => { setNome(e.target.value); if (error) setError(''); }}
              placeholder="Nome completo"
              className={styles.input}
              disabled={loading}
            />
            <input
              type="text"
              value={cpf}
              onChange={e => { setCpf(formatCPF(e.target.value)); if (error) setError(''); }}
              placeholder="CPF (000.000.000-00)"
              className={styles.input}
              disabled={loading}
              inputMode="numeric"
            />
            <input
              type="tel"
              value={telefone}
              onChange={e => { setTelefone(formatPhone(e.target.value)); if (error) setError(''); }}
              placeholder="Telefone / WhatsApp"
              className={styles.input}
              disabled={loading}
              inputMode="numeric"
            />
          </>
        )}

        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
          placeholder="E-mail"
          className={styles.input}
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
          placeholder="Senha (mínimo 6 caracteres)"
          className={styles.input}
          required
          minLength={6}
          disabled={loading}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
        </button>

        <button
          type="button"
          className={styles.toggleMode}
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          style={{
            background: 'none',
            border: 'none',
            marginTop: '1rem',
            cursor: 'pointer',
            color: 'var(--admin-accent)',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar agora'}
        </button>
      </form>
    </main>
  );
}
