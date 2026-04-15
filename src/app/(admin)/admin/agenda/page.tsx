'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import { AgendaEvent } from '@/lib/types/database';
import styles from './AdminAgenda.module.css';

export default function AdminAgenda() {
  const { currentEvent } = useEvent();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AgendaEvent>>({
    titulo: '',
    horario: '19:00',
    local_nome: '',
    endereco: '',
    link_google_maps: '',
    link_waze: '',
    icone: 'church',
    ordem: 0
  });

  const fetchData = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const { data } = await supabase
      .from('eventos_agenda')
      .select('*')
      .eq('evento_id', currentEvent.id)
      .order('ordem', { ascending: true });
    
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    const payload = {
      ...formData,
      evento_id: currentEvent.id
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('eventos_agenda').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('eventos_agenda').insert([payload]);
      error = err;
    }

    if (!error) {
      setIsAdding(false);
      setEditingId(null);
      setFormData({ titulo: '', horario: '19:00', local_nome: '', endereco: '', link_google_maps: '', link_waze: '', icone: 'church', ordem: events.length });
      fetchData();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleEdit = (event: AgendaEvent) => {
    setFormData(event);
    setEditingId(event.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este marco da agenda?')) {
      const { error } = await supabase.from('eventos_agenda').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  if (!currentEvent) return <div className={styles.container}>Selecione um evento para gerenciar a agenda.</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">Programação do Evento</h1>
        <button onClick={() => setIsAdding(true)} className={styles.addBtn}>+ Novo Marco</button>
      </header>

      {isAdding && (
        <section className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar Marco' : 'Novo Marco na Agenda'}</h2>
            
            <div className={styles.fieldGroup}>
              <label>Título (Ex: Cerimônia, Recepção)</label>
              <input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required />
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label>Horário</label>
                <input type="time" value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})} required />
              </div>
              <div className={styles.fieldGroup}>
                <label>Ícone</label>
                <select value={formData.icone} onChange={e => setFormData({...formData, icone: e.target.value})}>
                  <option value="church">Igreja / Cerimônia</option>
                  <option value="party">Festa / Recepção</option>
                  <option value="food">Jantar / Almoço</option>
                  <option value="ring">Alianças</option>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Nome do Local</label>
              <input value={formData.local_nome} onChange={e => setFormData({...formData, local_nome: e.target.value})} required />
            </div>

            <div className={styles.fieldGroup}>
              <label>Endereço Completo</label>
              <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} required />
            </div>

            <div className={styles.fieldGroup}>
              <label>Link Google Maps (Opcional)</label>
              <input value={formData.link_google_maps} onChange={e => setFormData({...formData, link_google_maps: e.target.value})} placeholder="https://maps.google.com/..." />
            </div>

            <div className={styles.fieldGroup}>
              <label>Link Waze (Opcional)</label>
              <input value={formData.link_waze} onChange={e => setFormData({...formData, link_waze: e.target.value})} placeholder="https://waze.com/ul?..." />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn}>Salvar</button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className={styles.cancelBtn}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <div className={styles.grid}>
        {events.map(event => (
          <div key={event.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.time}>{event.horario.substring(0, 5)}</span>
              <h3>{event.titulo}</h3>
            </div>
            <p><strong>{event.local_nome}</strong></p>
            <p className={styles.address}>{event.endereco}</p>
            <div className={styles.cardActions}>
              <button onClick={() => handleEdit(event)} className={styles.editBtn}>Editar</button>
              <button onClick={() => handleDelete(event.id)} className={styles.deleteBtn}>Excluir</button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className={styles.empty}>Nenhum marco cadastrado na agenda.</p>}
      </div>
    </main>
  );
}
