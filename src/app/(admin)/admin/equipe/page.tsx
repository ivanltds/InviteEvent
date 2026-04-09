'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { EventoOrganizador } from '@/lib/types/database';
import styles from './Equipe.module.css';

export default function EquipePage() {
  const { currentEvent } = useEvent();
  const [organizers, setOrganizers] = useState<(EventoOrganizador & { email: string })[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchOrganizers = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const data = await eventService.getOrganizers(currentEvent.id);
    setOrganizers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizers();
  }, [currentEvent]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !newEmail) return;

    setActionLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await eventService.addOrganizer(currentEvent.id, newEmail);
      setMessage({ text: 'Organizador adicionado com sucesso!', type: 'success' });
      setNewEmail('');
      await fetchOrganizers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao adicionar organizador.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!currentEvent || !confirm('Tem certeza que deseja remover este organizador?')) return;

    setActionLoading(true);
    try {
      await eventService.removeOrganizer(currentEvent.id, userId);
      await fetchOrganizers();
      setMessage({ text: 'Organizador removido.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Erro ao remover organizador.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentEvent) return <p className={styles.loading}>Selecione um evento...</p>;
  if (loading) return <p className={styles.loading}>Carregando equipe...</p>;

  return (
    <main className={styles.container}>
      <h1 className="cursive">Equipe do Evento</h1>
      <p>Gerencie quem pode ajudar você na organização deste casamento.</p>

      <section className={styles.addSection}>
        <h3>Convidar Organizador</h3>
        <form onSubmit={handleAdd} className={styles.form}>
          <input 
            type="email" 
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="E-mail do colaborador..."
            required
            className={styles.input}
          />
          <button type="submit" className={styles.addBtn} disabled={actionLoading}>
            {actionLoading ? 'Adicionando...' : 'Convidar'}
          </button>
        </form>
        {message.text && (
          <p className={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </p>
        )}
      </section>

      <section className={styles.listSection}>
        <h3>Organizadores Atuais</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org.user_id}>
                  <td>{org.email}</td>
                  <td>
                    <span className={org.role === 'owner' ? styles.badgeOwner : styles.badgeOrg}>
                      {org.role === 'owner' ? 'Proprietário' : 'Organizador'}
                    </span>
                  </td>
                  <td>
                    {org.role !== 'owner' && (
                      <button 
                        onClick={() => handleRemove(org.user_id)}
                        className={styles.removeBtn}
                        disabled={actionLoading}
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
