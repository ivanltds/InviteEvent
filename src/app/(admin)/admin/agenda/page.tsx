'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import { AgendaEvent } from '@/lib/types/database';
import styles from './AdminAgenda.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAgenda() {
  const { currentEvent } = useEvent();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const getIcon = (icone: string) => {
    switch(icone) {
      case 'church': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>;
      case 'party': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>; // Ray/Flash for party
      case 'food': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path></svg>;
      case 'ring': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle></svg>;
      case 'music': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
      case 'drink': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10 10-10"></path><path d="M12 22V12"></path><path d="M7 22h10"></path></svg>;
      case 'photo': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
      default: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
    }
  };

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
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (event: AgendaEvent) => {
    setFormData(event);
    setEditingId(event.id);
    setIsAdding(true);
  };

  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const { error } = await supabase.from('eventos_agenda').delete().eq('id', confirmDeleteId);
    if (!error) fetchData();
    setConfirmDeleteId(null);
  };

  if (!currentEvent) return <div className={styles.container}>Selecione um evento para gerenciar a agenda.</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Programação do Evento</h1>
          <p className={styles.subtitle}>Organize os momentos importantes e localize os convidados.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className={styles.addBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Marco
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <div className={styles.modalOverlay} onClick={() => { setIsAdding(false); setEditingId(null); }}>
            <motion.form 
              className={styles.modal} 
              onSubmit={handleSubmit}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
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
                  <option value="church">Cerimônia</option>
                  <option value="party">Festa</option>
                  <option value="food">Almoço/Jantar</option>
                  <option value="drink">Brinde/Bar</option>
                  <option value="ring">Alianças</option>
                  <option value="music">Pista de Dança</option>
                  <option value="photo">Sessão de Fotos</option>
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
          </motion.form>
        </div>
        )}
      </AnimatePresence>

      <div className={styles.grid}>
        {events.map((event, i) => (
          <motion.div 
            key={event.id} 
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={styles.cardIconWrapper}>
              {getIcon(event.icone)}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <span className={styles.time}>{event.horario.substring(0, 5)}</span>
                <h3>{event.titulo}</h3>
              </div>
              <p className={styles.locationName}>{event.local_nome}</p>
              <p className={styles.address}>{event.endereco}</p>
              
              <div className={styles.cardFooter}>
                <div className={styles.mapLinks}>
                  {event.link_google_maps && (
                    <span className={styles.mapBadge}>Maps✓</span>
                  )}
                  {event.link_waze && (
                    <span className={styles.mapBadge}>Waze✓</span>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(event); }} className={styles.miniEditBtn} data-tooltip="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); triggerDelete(event.id); }} className={styles.miniDeleteBtn} data-tooltip="Excluir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {events.length === 0 && <p className={styles.empty}>Nenhum marco cadastrado na agenda ainda.</p>}
      </div>

      {/* MODAL DE EXCLUSÃO */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className={styles.deleteOverlay} onClick={() => setConfirmDeleteId(null)}>
            <motion.div 
              className={styles.deleteModal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Excluir Marco?</h3>
              <p>Tem certeza que deseja remover este momento da programação oficial?</p>
              <div className={styles.deleteActions}>
                <button className={styles.cancelDeleteBtn} onClick={() => setConfirmDeleteId(null)}>Voltar</button>
                <button className={styles.confirmDeleteBtn} onClick={executeDelete}>Confirmar Exclusão</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
