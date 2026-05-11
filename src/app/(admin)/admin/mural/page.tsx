'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import styles from './AdminMural.module.css';
import MuralModeration from '@/components/admin/MuralModeration';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'mensagens' | 'fotos';

export default function AdminMural() {
  const { currentEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<Tab>('mensagens');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const { data } = await supabase
      .from('mural_mensagens')
      .select('*')
      .eq('evento_id', currentEvent.id)
      .order('created_at', { ascending: false });
    
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'mensagens') {
      fetchMessages();
    }
  }, [currentEvent, activeTab]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('mural_mensagens')
      .update({ status })
      .eq('id', id);
    
    if (!error) fetchMessages();
  };

  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const { error } = await supabase.from('mural_mensagens').delete().eq('id', confirmDeleteId);
    if (!error) fetchMessages();
    setConfirmDeleteId(null);
  };

  if (!currentEvent) return <div className={styles.container}>Selecione um evento...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Moderação do Mural</h1>
        <p>Gerencie o que seus convidados estão compartilhando.</p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'mensagens' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('mensagens')}
        >
          Recados
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'fotos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('fotos')}
        >
          Fotos
        </button>
      </div>

      {activeTab === 'mensagens' ? (
        <div className={styles.grid}>
          {loading ? <p>Carregando...</p> : messages.map(msg => (
            <div key={msg.id} className={`${styles.card} ${styles[msg.status]}`}>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <strong>{msg.nome_convidado}</strong>
                  <span className={styles.statusBadge}>{msg.status}</span>
                </div>
                <p className={styles.text}>"{msg.mensagem}"</p>
                <span className={styles.date}>{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <div className={styles.actions}>
                {msg.status !== 'aprovado' && (
                  <button onClick={() => updateStatus(msg.id, 'aprovado')} className={styles.approveBtn}>Aprovar</button>
                )}
                {msg.status !== 'oculto' && (
                  <button onClick={() => updateStatus(msg.id, 'oculto')} className={styles.hideBtn}>Ocultar</button>
                )}
                <button onClick={() => triggerDelete(msg.id)} className={styles.deleteBtn}>Excluir</button>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className={styles.empty}>Nenhum recado recebido ainda.</p>}
        </div>
      ) : (
        <MuralModeration eventId={currentEvent.id} />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
            <motion.div 
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Confirmar Exclusão</h3>
              <p>Deseja apagar esta mensagem permanentemente do mural?</p>
              <div className={styles.modalActions}>
                <button className={styles.cancelDeleteBtn} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className={styles.confirmDeleteBtn} onClick={executeDelete}>Sim, Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
