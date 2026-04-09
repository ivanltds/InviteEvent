'use client';

import { useState } from 'react';
import styles from './AdminEvents.module.css';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { configService } from '@/lib/services/configService';
import OnboardingWizard from '@/components/admin/OnboardingWizard';

export default function AdminEvents() {
  const { events, refreshEvents, setCurrentEvent, currentEvent } = useEvent();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: any) => {
    setLoading(true);
    try {
      // 1. Criar o evento básico (isso já adiciona o criador como owner no banco)
      const { data: event, error } = await eventService.createEvent(data.nome);
      
      if (error || !event) throw error || new Error('Falha ao criar evento');

      // 2. Atualizar as configurações iniciais preenchidas no Wizard
      await configService.updateConfig(event.id, {
        noiva_nome: data.noiva_nome,
        noivo_nome: data.noivo_nome,
        data_casamento: data.data_casamento,
        pix_chave: data.pix_chave,
        mostrar_historia: true,
        mostrar_noivos: true,
        mostrar_faq: true,
        mostrar_presentes: true
      });

      await refreshEvents();
      setCurrentEvent(event);
      setIsAdding(false);
      alert('Evento criado com sucesso! ✨');
    } catch (err: any) {
      alert('Erro ao criar evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Seus Eventos</h1>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>Novo Evento</button>
      </header>

      {isAdding && (
        <OnboardingWizard 
          onComplete={handleCreate} 
        />
      )}

      {loading && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ textAlign: 'center' }}>
            <h2>Criando seu evento...</h2>
            <p>Estamos preparando tudo com muito carinho. ❤️</p>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {events.map(event => (
          <div 
            key={event.id} 
            className={`${styles.card} ${currentEvent?.id === event.id ? styles.activeCard : ''}`}
            onClick={() => setCurrentEvent(event)}
          >
            <h3>{event.nome}</h3>
            <p>slug: {event.slug}</p>
            <div className={styles.cardFooter}>
              <span>{new Date(event.created_at).toLocaleDateString()}</span>
              {currentEvent?.id === event.id && <span className={styles.activeBadge}>Ativo</span>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
