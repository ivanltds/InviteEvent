'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { eventService } from '@/lib/services/eventService';
import styles from '@/app/(admin)/admin/admin.module.css';

interface InviteInfoData {
  valid: boolean;
  evento_id?: string;
  evento_nome?: string;
  role?: 'owner' | 'organizador';
  email_destinatario?: string;
  criado_por_email?: string;
  error?: string;
}

function AceitarConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfoData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError('Token de convite não informado.');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const info = await eventService.getInviteInfo(token);
        if (!info.valid) {
          setError(info.error || 'Convite inválido ou expirado.');
        } else {
          setInviteInfo(info);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados do convite.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await eventService.acceptTeamInvite(token);
      if (res.success) {
        localStorage.setItem('last_event_id', res.evento_id);
        router.push('/admin/dashboard?convite=aceito');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao aceitar o convite.';
      setError(message);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} style={{ textAlign: 'center' }}>
          <p>Validando convite de equipe...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--admin-danger, #d9534f)', marginBottom: '1rem' }}>Ops! Convite Inválido</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>{error || 'Não foi possível localizar este convite.'}</p>
          <Link href="/admin/login" className={styles.buttonPrimary} style={{ display: 'inline-block', textDecoration: 'none' }}>
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  const roleLabel = inviteInfo.role === 'owner' 
    ? 'Co-Proprietário(a) (Acesso Total)' 
    : 'Organizador(a)';

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard} style={{ textAlign: 'center', maxWidth: '480px' }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💍</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Convite de Equipe
        </h2>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Você foi convidado(a) para participar da gestão do casamento:
        </p>

        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.3rem', color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>
            {inviteInfo.evento_nome}
          </h3>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: inviteInfo.role === 'owner' ? '#d4af37' : '#e2e8f0',
            color: inviteInfo.role === 'owner' ? '#fff' : '#475569',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            Função: {roleLabel}
          </span>
          {inviteInfo.criado_por_email && (
            <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '0.75rem', marginBottom: 0 }}>
              Convite enviado por: {inviteInfo.criado_por_email}
            </p>
          )}
        </div>

        {currentUser ? (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              Você está conectado como <strong>{currentUser.email}</strong>
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className={styles.buttonPrimary}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              {accepting ? 'Vinculando ao evento...' : 'Aceitar Convite e Entrar no Painel'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.25rem' }}>
              Faça login ou crie sua conta para aceitar o convite e começar a gerenciar o evento.
            </p>
            <Link
              href={`/admin/login?redirect=${encodeURIComponent(`/admin/equipe/aceitar?token=${token}`)}`}
              className={styles.buttonPrimary}
              style={{ display: 'block', width: '100%', textAlign: 'center', textDecoration: 'none', padding: '0.85rem' }}
            >
              Fazer Login ou Criar Conta
            </Link>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--admin-danger, #d9534f)', fontSize: '0.85rem', marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} style={{ textAlign: 'center' }}>
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <AceitarConviteContent />
    </Suspense>
  );
}
