'use client';

import { useState, useEffect } from 'react';
import { muralService, MuralPhoto } from '@/lib/services/muralService';
import styles from './MuralModeration.module.css';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface MuralModerationProps {
  eventId: string;
}

export default function MuralModeration({ eventId }: MuralModerationProps) {
  const [photos, setPhotos] = useState<MuralPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const fetchPhotos = async () => {
    setLoading(true);
    const data = await muralService.getPhotosForModeration(eventId);
    setPhotos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [eventId]);

  const handleStatusUpdate = async (id: string, isApproved: boolean) => {
    const success = await muralService.updatePhotoStatus(id, isApproved);
    if (success) {
      setPhotos(photos.map(p => p.id === id ? { ...p, is_approved: isApproved } : p));
    }
  };

  const handleEdit = (photo: MuralPhoto) => {
    setEditingId(photo.id!);
    setEditCaption(photo.legenda || '');
  };

  const handleSaveCaption = async (id: string) => {
    const { error } = await supabase
      .from('mural_fotos')
      .update({ legenda: editCaption })
      .eq('id', id);
    
    if (!error) {
      setPhotos(photos.map(p => p.id === id ? { ...p, legenda: editCaption } : p));
      setEditingId(null);
    } else {
      alert('Erro ao salvar legenda.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta foto?')) {
      const success = await muralService.deletePhoto(id);
      if (success) {
        setPhotos(photos.filter(p => p.id !== id));
      }
    }
  };

  if (loading) return <div className={styles.loading}>Carregando fotos...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Moderação de Fotos</h2>
      <div className={styles.grid}>
        {photos.map(photo => (
          <div key={photo.id} className={`${styles.card} ${photo.is_approved ? styles.approved : styles.pending}`}>
            <div className={styles.imageWrapper}>
              <Image 
                src={photo.url_foto} 
                alt={photo.legenda || 'Foto do mural'} 
                fill 
                className={styles.image}
              />
            </div>
            <div className={styles.content}>
              <p className={styles.guestName}>{photo.guest_name || 'Anônimo'}</p>
              
              {editingId === photo.id ? (
                <div className={styles.editArea}>
                  <textarea 
                    value={editCaption} 
                    onChange={(e) => setEditCaption(e.target.value)}
                    className={styles.editTextarea}
                  />
                  <div className={styles.editActions}>
                    <button onClick={() => handleSaveCaption(photo.id!)} className={styles.saveBtn}>Salvar</button>
                    <button onClick={() => setEditingId(null)} className={styles.cancelBtn}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles.caption}>{photo.legenda || <span className={styles.noCaption}>Sem legenda</span>}</p>
                  <button onClick={() => handleEdit(photo)} className={styles.editBtn}>Editar Legenda</button>
                </>
              )}

              <div className={styles.actions}>
                {!photo.is_approved ? (
                  <button 
                    onClick={() => handleStatusUpdate(photo.id!, true)}
                    className={styles.approveBtn}
                  >
                    Aprovar Foto
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStatusUpdate(photo.id!, false)}
                    className={styles.rejectBtn}
                  >
                    Ocultar Foto
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(photo.id!)}
                  className={styles.deleteBtn}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className={styles.empty}>Nenhuma foto enviada para o mural.</p>}
      </div>
    </div>
  );
}
