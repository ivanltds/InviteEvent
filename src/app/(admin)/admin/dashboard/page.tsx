'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/admin/OnboardingWizard';

export default function DashboardPage() {
  const { currentEvent, events, setCurrentEvent, refreshEvents, loading: contextLoading } = useEvent();

  const [isCreating, setIsCreating] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [eventName, setEventName] = useState('');
  const [stats, setStats] = useState({ totalConvites: 0, totalConfirmados: 0, valorPresentes: 0 });
  const [recentRSVPs, setRecentRSVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (currentEvent && !currentEvent.onboarding_completed) {
      setShowWizard(true);
    } else {
      setShowWizard(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    async function fetchData() {
      if (!currentEvent) return;
      setLoading(true);
      const s = await eventService.getEventStats(currentEvent.id);
      // Aqui simulamos valor de presentes já que ainda não temos a soma real no service
      setStats({ ...s, valorPresentes: 0 });
      
      const { data: rsvps } = await supabase
        .from('rsvp')
        .select('*, convites(nome_principal)')
        .eq('evento_id', currentEvent.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentRSVPs(rsvps || []);
      setLoading(false);
    }
    fetchData();
  }, [currentEvent]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await eventService.createEvent(eventName);
    if (data) {
      await refreshEvents();
      setIsCreating(false);
      setEventName('');
    }
    setLoading(false);
  };

  const calculateDaysLeft = (date: string) => {
    if (!date) return 0;
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (contextLoading) return <div className={styles.loading}>Carregando...</div>;

  // Se não houver evento selecionado, mostra a lista de casamentos (Modo Plataforma)
  if (!currentEvent) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className="cursive">Meus Casamentos</h1>
          <button onClick={() => setIsCreating(true)} className={styles.addBtn}>+ Novo Casamento</button>
        </header>
        <div className={styles.grid}>
          {events.map(event => (
            <div key={event.id} className={styles.card} onClick={() => {
              setCurrentEvent(event);
              // O Sidebar vai detectar a mudança e permitir entrar no modo operacional
            }}>
              <h3>{event.nome}</h3>
              <span className={styles.slug}>inv/{event.slug}</span>
            </div>
          ))}
        </div>
        {isCreating && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className="cursive">Novo Casamento</h2>
              <form onSubmit={handleCreate}>
                <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Nomes do casal..." required />
                <button type="submit" className={styles.saveBtn}>Criar</button>
                <button type="button" onClick={() => setIsCreating(false)}>Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Se houver evento, mostra o Dashboard Operacional (STORY-048)
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">Painel do Casamento</h1>
        <div className={styles.status}>
          <span className={currentEvent.is_active ? styles.activeBadge : styles.pendingBadge}>
            {currentEvent.is_active ? 'Site Ativo' : 'Aguardando Ativação'}
          </span>
        </div>
      </header>

      {(!currentEvent.onboarding_completed || !currentEvent.is_active) && (
        <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--admin-warning)', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>🎉 Bem-vindo ao painel do seu evento!</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--admin-text-primary)'}}>
              Seu convite inicial já está de pé! Vá na aba <strong>Configurações</strong> para adicionar as suas fotos de capa e biografia.
            </p>
          </div>
          <button onClick={() => router.push('/admin/configuracoes')} style={{ padding: '8px 16px', background: 'var(--admin-warning)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Personalizar
          </button>
        </div>
      )}

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Convidados</span>
          <strong>{stats.totalConfirmados} / {stats.totalConvites}</strong>
          <div className={styles.progressBar}><div style={{ width: `${(stats.totalConfirmados/stats.totalConvites)*100 || 0}%` }}></div></div>
        </div>
        <div className={styles.statCard}>
          <span>Presentes Recebidos</span>
          <strong>R$ {stats.valorPresentes.toLocaleString('pt-BR')}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Dias Restantes</span>
          <strong>{calculateDaysLeft('2026-06-13')}</strong>
        </div>
      </section>

      <div className={styles.dashboardContent}>
        <section className={styles.recentActivity}>
          <h3>Últimas Confirmações</h3>
          {recentRSVPs.length === 0 ? <p>Nenhuma atividade recente.</p> : (
            <ul className={styles.activityList}>
              {recentRSVPs.map(r => (
                <li key={r.id}>
                  <strong>{r.convites?.nome_principal}</strong> confirmou {r.confirmados} pessoa(s).
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showWizard && (
        <OnboardingWizard 
          eventId={currentEvent.id} 
          onComplete={async () => {
            setShowWizard(false);
            await refreshEvents();
          }} 
        />
      )}
    </main>
  );
}
