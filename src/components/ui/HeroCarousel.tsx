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
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());

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

    // Se ainda estiver vazio, usamos imagens placeholder premium para não quebrar o visual (e garantir contraste com o texto branco)
    if (queue.length === 0) {
      queue.push({ type: 'image', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200' });
      queue.push({ type: 'image', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200' });
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
        // Renderizamos apenas a mídia atual e a próxima para poupar memória do navegador
        const isCurrentOrNext = index === currentIndex || index === (currentIndex + 1) % mediaQueue.length;
        if (!isCurrentOrNext) return null;

        const isActive = index === currentIndex;
        
        if (item.type === 'video') {
          const isLoaded = loadedMedia.has(item.url);
          return (
            <video
              key={item.url}
              className={`${styles.slide} ${styles.videoSlide} ${isActive && isLoaded ? styles.active : ''}`}
              src={item.url}
              muted
              playsInline
              preload={isActive ? "auto" : "none"}
              onCanPlay={() => {
                setLoadedMedia(prev => {
                  const newSet = new Set(prev);
                  newSet.add(item.url);
                  return newSet;
                });
              }}
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
