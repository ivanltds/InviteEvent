'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { galleryService, Album, Foto } from '@/lib/services/galleryService';
import styles from './Galeria.module.css';

export default function GaleriaAdminPage() {
  const { currentEvent } = useEvent();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Foto[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('[Galeria] Evento atual mudou:', currentEvent?.nome);
    if (currentEvent) {
      fetchAlbums();
    }
  }, [currentEvent]);

  useEffect(() => {
    console.log('[Galeria] Álbum selecionado mudou:', selectedAlbum?.nome);
    if (selectedAlbum) {
      fetchPhotos();
    } else {
      setPhotos([]);
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    if (!currentEvent) return;
    setLoading(true);
    try {
      console.log('[Galeria] Buscando álbuns para:', currentEvent.id);
      const data = await galleryService.getAlbums(currentEvent.id);
      console.log('[Galeria] Álbuns recebidos:', data.length);
      setAlbums(data);
      
      // Se voltamos para a página e temos álbuns, selecionamos o primeiro se nenhum estiver selecionado
      if (data.length > 0 && !selectedAlbum) {
        setSelectedAlbum(data[0]);
      }
    } catch (err: any) {
      console.error('[Galeria] Erro ao buscar álbuns:', err);
      alert('Erro ao carregar álbuns: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    if (!selectedAlbum) return;
    try {
      console.log('[Galeria] Buscando fotos para álbum:', selectedAlbum.id);
      const data = await galleryService.getPhotos(selectedAlbum.id);
      setPhotos(data);
    } catch (err: any) {
      console.error('[Galeria] Erro ao buscar fotos:', err);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !newAlbumName) return;
    
    try {
      const album = await galleryService.createAlbum(currentEvent.id, newAlbumName);
      if (album) {
        setNewAlbumName('');
        await fetchAlbums();
        setSelectedAlbum(album);
      }
    } catch (err: any) {
      console.error('[Galeria] Erro ao criar álbum:', err);
      alert('Erro ao criar álbum: ' + err.message);
    }
  };

  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentEvent || !selectedAlbum) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      // 1. Obter assinatura base (reutilizável se o timestamp for próximo, mas pedimos uma para o lote por segurança ou uma por arquivo se demorar)
      // Para simplificar e garantir, pedimos a assinatura para o lote.
      const signData = await galleryService.getSignature(currentEvent.id, 'galeria');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.api_key);
        formData.append('timestamp', signData.timestamp);
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          console.error('Cloudinary Error:', data);
          continue; // Pula este arquivo se der erro e continua o lote
        }

        // 3. Salvar no Supabase
        await galleryService.addPhoto({
          album_id: selectedAlbum.id,
          evento_id: currentEvent.id,
          url: data.secure_url,
          public_id: data.public_id,
          largura: data.width,
          altura: data.height
        });
      }

      fetchPhotos();
    } catch (err: any) {
      console.error('Erro detalhado no upload:', err);
      alert('Erro no processamento do lote: ' + (err.message || 'Falha ao subir imagens.'));
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm('Excluir esta foto?')) {
      await galleryService.deletePhoto(id);
      fetchPhotos();
    }
  };

  if (!currentEvent) return <p className={styles.loading}>Selecione um evento...</p>;

  return (
    <main className={styles.container}>
      <h1 className="cursive">Galeria de Fotos</h1>
      
      <section className={styles.albumSection}>
        <div className={styles.sectionHeader}>
          <h2>Álbuns</h2>
          <form onSubmit={handleCreateAlbum} className={styles.albumForm}>
            <input 
              type="text" 
              placeholder="Nome do novo álbum..." 
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              required
            />
            <button type="submit">Criar Álbum</button>
          </form>
        </div>

        <div className={styles.albumGrid}>
          {albums.map(album => (
            <button 
              key={album.id} 
              className={`${styles.albumCard} ${selectedAlbum?.id === album.id ? styles.active : ''}`}
              onClick={() => setSelectedAlbum(album)}
            >
              {album.nome}
            </button>
          ))}
        </div>
      </section>

      {selectedAlbum && (
        <section className={styles.photoSection}>
          <div className={styles.sectionHeader}>
            <h2>Fotos em: {selectedAlbum.nome}</h2>
            <div className={styles.uploadWrapper}>
              <input 
                type="file" 
                id="photo-upload" 
                hidden 
                accept="image/*" 
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
              <label htmlFor="photo-upload" className={styles.uploadBtn}>
                {uploading ? `Subindo ${uploadProgress.current}/${uploadProgress.total}...` : '+ Adicionar Fotos'}
              </label>
            </div>
          </div>

          <div className={styles.photoGrid}>
            {photos.map(photo => (
              <div key={photo.id} className={styles.photoItem}>
                <img src={photo.url} alt="Foto da galeria" loading="lazy" />
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
