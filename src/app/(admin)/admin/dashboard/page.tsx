'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import styles from './Dashboard.module.css';
import { Evento } from '@/lib/types/database';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { events, setCurrentEvent, refreshEvents, loading: contextLoading } = useEvent();
  const [isCreating, setIsCreating] = useState(false);
  const [eventName, setEventName] = useState('');
  const [stats, setStats] = useState<Record<string, { totalConvites: number, totalConfirmados: number }>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      const newStats: any = {};
      for (const event of events) {
        const s = await eventService.getEventStats(event.id);
        newStats[event.id] = s;
      }
      setStats(newStats);
    }
    if (events.length > 0) fetchStats();
  }, [events]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await eventService.createEvent(eventName);

    if (err) {
      setError(err.message);
      setLoading(false);
    } else if (data) {
      await refreshEvents();
      setCurrentEvent(data);
      setIsCreating(false);
      setEventName('');
      setLoading(false);
      // Redireciona para convidados do novo evento
      router.push('/admin/convidados');
    }
  };

  const calculateDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (contextLoading) return <div className={styles.loading}>Carregando painel...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">Meus Casamentos</h1>
        <button onClick={() => setIsCreating(true)} className={styles.addBtn}>
          + Novo Casamento
        </button>
      </header>

      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Você ainda não gerencia nenhum casamento.</p>
          <button onClick={() => setIsCreating(true)} className={styles.createFirstBtn}>
            Criar meu primeiro evento agora
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map(event => (
            <div key={event.id} className={styles.card} onClick={() => {
              setCurrentEvent(event);
              router.push('/admin/convidados');
            }}>
              <div className={styles.cardHeader}>
                <h3>{event.nome}</h3>
                <span className={styles.slug}>inv/{event.slug}</span>
              </div>
              
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span>Convidados</span>
                  <strong>{stats[event.id]?.totalConvites ?? '...'}</strong>
                </div>
                <div className={styles.metric}>
                  <span>Confirmados</span>
                  <strong>{stats[event.id]?.totalConfirmados ?? '...'}</strong>
                </div>
              </div>

              <div className={styles.footer}>
                <button className={styles.manageBtn}>Gerenciar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className="cursive">Novo Casamento</h2>
            <form onSubmit={handleCreate}>
              <label>Nome do Evento (Ex: Casamento de Maria e João)</label>
              <input 
                type="text" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Nomes do casal..."
                required
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsCreating(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
