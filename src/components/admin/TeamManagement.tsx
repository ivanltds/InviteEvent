'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { EventoOrganizador } from '@/lib/types/database';
import styles from './AdminComponents.module.css';

export default function TeamManagement() {
  const { currentEvent, userProfile } = useEvent();
  const [organizers, setOrganizers] = useState<(EventoOrganizador & { email: string })[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

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
    if (!currentEvent) return;
    setAdding(true);
    try {
      await eventService.addOrganizer(currentEvent.id, email);
      setEmail('');
      await fetchOrganizers();
      alert('Organizador adicionado!');
    } catch (err: any) {
      alert(err.message);
    }
    setAdding(false);
  };

  const handleRemove = async (userId: string) => {
    if (!currentEvent) return;
    if (confirm('Remover este organizador?')) {
      await eventService.removeOrganizer(currentEvent.id, userId);
      await fetchOrganizers();
    }
  };

  const handleTransfer = async (userId: string) => {
    if (!currentEvent) return;
    if (confirm('Deseja transferir a posse deste evento? Você deixará de ser Owner.')) {
      const ok = await eventService.transferOwnership(currentEvent.id, userId);
      if (ok) {
        alert('Posse transferida!');
        window.location.reload();
      }
    }
  };

  if (!currentEvent) return null;

  const myRole = organizers.find(o => o.user_id === userProfile?.id)?.role;
  const isOwnerOrMaster = myRole === 'owner' || userProfile?.is_master;

  if (!isOwnerOrMaster) {
    return <p>Apenas o Owner pode gerenciar a equipe.</p>;
  }

  return (
    <div className={styles.managerContainer}>
      <form onSubmit={handleAdd} className={styles.faqForm}>
        <h3>Adicionar Organizador</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="E-mail do usuário" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className={styles.saveBtn} disabled={adding}>
            {adding ? '...' : 'Adicionar'}
          </button>
        </div>
        <p className={styles.helpText}>O usuário deve ter uma conta criada no sistema.</p>
      </form>

      <div className={styles.faqList}>
        <h3>Equipe do Evento</h3>
        {loading ? <p>Carregando...</p> : organizers.map(org => (
          <div key={org.user_id} className={styles.faqItem}>
            <div>
              <strong>{org.email}</strong>
              <p>Função: <span className={styles.badge}>{org.role}</span></p>
            </div>
            <div className={styles.itemActions}>
              {org.role !== 'owner' && (
                <>
                  <button onClick={() => handleTransfer(org.user_id)}>Tornar Owner</button>
                  <button onClick={() => handleRemove(org.user_id)} className={styles.deleteBtn}>Remover</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
