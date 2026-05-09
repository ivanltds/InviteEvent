'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import styles from './HeroCarousel.module.css';

interface HeroCarouselProps {
  imagesOverride?: string[];
  videosOverride?: string[];
}

type MediaType = 'image' | 'video';

interface MediaItem {
  type: MediaType;
  url: string;
}

export default function HeroCarousel({ imagesOverride = [], videosOverride = [] }: HeroCarouselProps) {
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Unifica e randomiza/ordena as mídias (Vídeos primeiro ou intercalados)
  const mediaQueue = useMemo<MediaItem[]>(() => {
    const queue: MediaItem[] = [];
    
    // Adicionar imagens
    if (imagesOverride && imagesOverride.length > 0) {
      imagesOverride.forEach(url => queue.push({ type: 'image', url }));
    }
    
    // Adicionar vídeos
    if (videosOverride && videosOverride.length > 0) {
      videosOverride.forEach(url => queue.push({ type: 'video', url }));
    }

    return queue;
  }, [imagesOverride, videosOverride]);

  useEffect(() => {
    // Quando temos media, removemos o loader
    if (mediaQueue.length > 0) {
      setLoading(false);
    }
  }, [mediaQueue]);

  useEffect(() => {
    if (mediaQueue.length <= 1) return;

    // Se a mídia atual for vídeo, deixamos o vídeo tocar. Caso contrário, ou quando terminar, pulamos.
    // O tempo base de imagem será 6s
    const currentMedia = mediaQueue[currentIndex];
    let timeout: NodeJS.Timeout;

    if (currentMedia.type === 'image') {
      timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaQueue.length);
      }, 6000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentIndex, mediaQueue]);

  const handleVideoEnded = () => {
    if (mediaQueue.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % mediaQueue.length);
    }
  };

  if (loading && mediaQueue.length === 0) {
    // Se estiver vazio depois de montar, mostramos fallback. 
    // Em caso real, setLoading fica false se estiver vazio tb.
    // Mas por via de regra, mantemos assim.
  }

  if (mediaQueue.length === 0) {
    return <div className={styles.fallback}></div>;
  }

  return (
    <div className={styles.carouselContainer}>
      {mediaQueue.map((item, index) => {
        const isActive = index === currentIndex;
        
        if (item.type === 'video') {
          return (
            <video
              key={item.url}
              className={`${styles.slide} ${styles.videoSlide} ${isActive ? styles.active : ''}`}
              src={item.url}
              muted
              playsInline
              // Só dá autoplay se estiver ativo ou for o único. 
              // Melhor deixar o React controlar via ref, mas o autoPlay na tag é útil p mobile
              autoPlay={isActive}
              onEnded={handleVideoEnded}
              // Forçamos o vídeo a reiniciar quando ficar ativo novamente
              ref={(el) => {
                if (el && isActive && el.paused) {
                  el.play().catch(() => {}); // catch para navegadores restritivos
                }
              }}
            />
          );
        }

        return (
          <div
            key={item.url}
            className={`${styles.slide} ${isActive ? styles.active : ''}`}
            style={{ backgroundImage: `url(${item.url})` }}
          />
        );
      })}
      <div className={styles.overlay}></div>
    </div>
  );
}
