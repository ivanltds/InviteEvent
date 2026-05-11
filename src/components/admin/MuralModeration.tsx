'use client';

import { useState, useEffect } from 'react';
import { muralService } from '@/lib/services/muralService';
import { MuralItem } from '@/lib/types/database';
import styles from './MuralModeration.module.css';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface MuralModerationProps {
  eventId: string;
}

export default function MuralModeration({ eventId }: MuralModerationProps) {
  const [items, setItems] = useState<MuralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const data = await muralService.getItemsForModeration(eventId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [eventId]);

  const handleStatusUpdate = async (id: string, isApproved: boolean) => {
    const success = await muralService.updateItemStatus(id, isApproved);
    if (success) {
      setItems(items.map(p => p.id === id ? { ...p, aprovado: isApproved } : p));
    }
  };

  const handleEdit = (item: MuralItem) => {
    setEditingId(item.id!);
    setEditCaption(item.mensagem || '');
  };

  const handleSaveCaption = async (id: string) => {
    const { error } = await supabase
      .from('mural_itens')
      .update({ mensagem: editCaption })
      .eq('id', id);
    
    if (!error) {
      setItems(items.map(p => p.id === id ? { ...p, mensagem: editCaption } : p));
      setEditingId(null);
    } else {
      console.error('Erro ao salvar mensagem.');
    }
  };

  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const success = await muralService.deleteItem(confirmDeleteId);
    if (success) {
      setItems(items.filter(p => p.id !== confirmDeleteId));
    }
    setConfirmDeleteId(null);
  };

  if (loading) return <div className={styles.loading}>Carregando itens do mural...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Moderação do Mural de Lembranças</h2>
      <div className={styles.grid}>
        {items.map(item => (
          <div key={item.id} className={`${styles.card} ${item.aprovado ? styles.approved : styles.pending}`}>
            {item.tipo === 'FOTO' || item.tipo === 'HIBRIDO' ? (
              <div className={styles.imageWrapper}>
                <img 
                  src={item.url_midia} 
                  alt={item.mensagem || 'Foto do mural'} 
                  className={styles.image}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
            ) : item.tipo === 'VIDEO' ? (
               <div className={styles.imageWrapper}>
                <video 
                  src={item.url_midia} 
                  className={styles.image}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              </div>
            ) : null}

            <div className={styles.content}>
              <div className={styles.badgeTipo}>
                {item.tipo === 'FOTO' && <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> <span>Foto</span></>}
                {item.tipo === 'VIDEO' && <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> <span>Vídeo</span></>}
                {item.tipo === 'MENSAGEM' && <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> <span>Mensagem</span></>}
                {item.tipo === 'HIBRIDO' && <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path></svg><span style={{margin:'0 2px'}}>+</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> <span>Híbrido</span></>}
              </div>
              <p className={styles.guestName}>{item.autor || 'Anônimo'}</p>
              
              {editingId === item.id ? (
                <div className={styles.editArea}>
                  <textarea 
                    value={editCaption} 
                    onChange={(e) => setEditCaption(e.target.value)}
                    className={styles.editTextarea}
                  />
                  <div className={styles.editActions}>
                    <button onClick={() => handleSaveCaption(item.id!)} className={styles.saveBtn}>Salvar</button>
                    <button onClick={() => setEditingId(null)} className={styles.cancelBtn}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles.caption}>{item.mensagem || <span className={styles.noCaption}>Sem mensagem</span>}</p>
                  <button onClick={() => handleEdit(item)} className={styles.editBtn}>Editar Mensagem</button>
                </>
              )}

              <div className={styles.actions}>
                {!item.aprovado ? (
                  <button 
                    onClick={() => handleStatusUpdate(item.id!, true)}
                    className={styles.approveBtn}
                  >
                    Aprovar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStatusUpdate(item.id!, false)}
                    className={styles.rejectBtn}
                  >
                    Ocultar
                  </button>
                )}
                <button 
                  onClick={() => triggerDelete(item.id!)}
                  className={styles.deleteBtn}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className={styles.empty}>Nenhum item enviado para o mural.</p>}
      </div>

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
            <motion.div 
              className={styles.modal} 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Confirmar Exclusão</h3>
              <p>Deseja realmente remover este item permanentemente? Esta ação não pode ser revertida.</p>
              <div className={styles.modalActions}>
                <button className={styles.cancelDeleteBtn} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className={styles.confirmDeleteBtn} onClick={executeDelete}>Sim, Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
