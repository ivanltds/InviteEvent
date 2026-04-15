'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Gallery.module.css';
import { galleryService, Foto } from '@/lib/services/galleryService';
import { Configuracao } from '@/lib/types/database';

interface GallerySectionProps {
  eventoId: string;
  config?: Configuracao;
}

export default function GallerySection({ eventoId, config }: GallerySectionProps) {
  const [photos, setPhotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Foto | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Busca todos os álbuns e pega as fotos
        const albums = await galleryService.getAlbums(eventoId);
        let allPhotos: Foto[] = [];
        for (const album of albums) {
          const albumPhotos = await galleryService.getPhotos(album.id);
          allPhotos = [...allPhotos, ...albumPhotos];
        }
        // Ordena por data (mais recentes primeiro)
        setPhotos(allPhotos.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
      } catch (e) {
        console.error('Erro ao carregar galeria:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventoId]);

  if (!loading && photos.length === 0) return null;

  return (
    <section className={styles.section} id="galeria">
      <div className={styles.container}>
        <motion.h2 
          className="cursive"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ color: config?.accent_color }}
        >
          Nossos Momentos
        </motion.h2>
        <p className={styles.subtitle}>Um pouco da nossa história em imagens</p>

        <div className={styles.masonryGrid}>
          {loading ? (
            <p>Carregando galeria...</p>
          ) : (
            photos.map((photo, index) => (
              <motion.div 
                key={photo.id}
                className={styles.photoWrapper}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 10) * 0.05 }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.url} 
                  alt="Momento do casal" 
                  className={styles.image}
                  loading="lazy"
                />
                <div className={styles.overlay}>
                  <span>🔍 Ver Detalhes</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              className={styles.lightboxContent}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedPhoto.url} alt="Foto ampliada" />
              <button className={styles.closeBtn} onClick={() => setSelectedPhoto(null)}>&times;</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
