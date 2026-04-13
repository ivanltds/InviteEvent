'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { Evento } from '@/lib/types/database';
import styles from './Eventos.module.css';

export default function EventosManagerPage() {
  const { userProfile, refreshEvents } = useEvent();
  const [eventList, setEventList] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [formData, setFormData] = useState({ nome: '', slug: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await eventService.getMyEvents();
    setEventList(data);
    setLoading(false);
  };

  const handleEdit = (event: Evento) => {
    setEditingEvent(event);
    setFormData({ nome: event.nome, slug: event.slug });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const ok = await eventService.updateEvent(editingEvent.id, formData);
    if (ok) {
      alert('Evento atualizado!');
      setEditingEvent(null);
      fetchEvents();
      refreshEvents();
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('ATENÇÃO: Isso excluirá permanentemente o casamento, convites, presentes e fotos. Deseja continuar?')) return;

    const ok = await eventService.deleteEvent(eventId);
    if (ok) {
      alert('Evento removido.');
      fetchEvents();
      refreshEvents();
    }
  };

  if (!userProfile?.is_master) return <p>Acesso restrito ao Administrador Master.</p>;

  return (
    <main className={styles.container}>
      <h1 className="cursive">Gestão Global de Eventos</h1>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome do Evento</th>
              <th>Slug (URL)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {eventList.map(event => (
              <tr key={event.id}>
                <td>{event.nome}</td>
                <td>inv/{event.slug}</td>
                <td className={styles.actions}>
                  <button onClick={() => handleEdit(event)} className={styles.editBtn}>Editar</button>
                  <button onClick={() => handleDelete(event.id)} className={styles.deleteBtn}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEvent && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Editar Informações do Evento</h3>
            <form onSubmit={handleSave}>
              <label>Nome</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              <label>URL Slug</label>
              <input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
              <div className={styles.modalActions}>
                <button type="submit">Salvar</button>
                <button type="button" onClick={() => setEditingEvent(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
