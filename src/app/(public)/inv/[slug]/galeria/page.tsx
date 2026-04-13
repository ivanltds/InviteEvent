'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { rsvpService } from '@/lib/services/rsvpService';
import { galleryService, Album, Foto } from '@/lib/services/galleryService';
import styles from './PublicGaleria.module.css';
import Link from 'next/link';

export default function PublicGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const invite = await rsvpService.getInviteBySlug(slug);
        if (invite) {
          const albumData = await galleryService.getAlbums(invite.evento_id);
          setAlbums(albumData);
          if (albumData.length > 0) setSelectedAlbum(albumData[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (selectedAlbum) {
      galleryService.getPhotos(selectedAlbum.id).then(setPhotos);
    }
  }, [selectedAlbum]);

  if (loading) return <div className={styles.loading}>Carregando momentos...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href={`/inv/${slug}`} className={styles.backBtn}>← Voltar ao Convite</Link>
        <h1 className="cursive">Nossa Galeria</h1>
        <p>Momentos inesquecíveis que queremos compartilhar com você.</p>
      </header>

      {albums.length > 1 && (
        <nav className={styles.albumNav}>
          {albums.map(album => (
            <button 
              key={album.id}
              className={selectedAlbum?.id === album.id ? styles.active : ''}
              onClick={() => setSelectedAlbum(album)}
            >
              {album.nome}
            </button>
          ))}
        </nav>
      )}

      <div className={styles.masonryGrid}>
        {photos.map(photo => (
          <div key={photo.id} className={styles.photoWrapper}>
            <img src={photo.url} alt="Momento do casal" loading="lazy" />
          </div>
        ))}
      </div>

      {photos.length === 0 && !loading && (
        <p className={styles.empty}>Este álbum ainda não possui fotos.</p>
      )}
    </main>
  );
}
