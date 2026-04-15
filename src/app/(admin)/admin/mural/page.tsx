'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import styles from './AdminMural.module.css';

export default function AdminMural() {
  const { currentEvent } = useEvent();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchMessages();
  }, [currentEvent]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('mural_mensagens')
      .update({ status })
      .eq('id', id);
    
    if (!error) fetchMessages();
  };

  const deleteMessage = async (id: string) => {
    if (confirm('Excluir este recado permanentemente?')) {
      const { error } = await supabase.from('mural_mensagens').delete().eq('id', id);
      if (!error) fetchMessages();
    }
  };

  if (!currentEvent) return <div className={styles.container}>Selecione um evento...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">Moderação do Mural</h1>
        <p>Aprove ou oculte os recados deixados pelos seus convidados.</p>
      </header>

      <div className={styles.list}>
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
              <button onClick={() => deleteMessage(msg.id)} className={styles.deleteBtn}>Excluir</button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className={styles.empty}>Nenhum recado recebido ainda.</p>}
      </div>
    </main>
  );
}
