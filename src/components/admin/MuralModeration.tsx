'use client';

import { useState, useEffect } from 'react';
import { muralService } from '@/lib/services/muralService';
import { MuralItem } from '@/lib/types/database';
import styles from './MuralModeration.module.css';
import { supabase } from '@/lib/supabase';

interface MuralModerationProps {
  eventId: string;
}

export default function MuralModeration({ eventId }: MuralModerationProps) {
  const [items, setItems] = useState<MuralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');

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
      alert('Erro ao salvar mensagem.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este item?')) {
      const success = await muralService.deleteItem(id);
      if (success) {
        setItems(items.filter(p => p.id !== id));
      }
    }
  };

  if (loading) return <div className={styles.loading}>Carregando itens do mural...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Moderação do Mural Vivo</h2>
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
                {item.tipo === 'FOTO' ? '📷 Foto' : item.tipo === 'VIDEO' ? '🎥 Vídeo' : item.tipo === 'MENSAGEM' ? '📝 Mensagem' : '📷+📝 Híbrido'}
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
                  onClick={() => handleDelete(item.id!)}
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
    </div>
  );
}
