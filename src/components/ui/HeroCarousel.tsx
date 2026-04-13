'use client';

import { useState, useEffect } from 'react';
import styles from './HeroCarousel.module.css';

interface HeroCarouselProps {
  imagesOverride?: string[];
}

export default function HeroCarousel({ imagesOverride }: HeroCarouselProps = {}) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      if (imagesOverride && imagesOverride.length > 0) {
        setImages(imagesOverride);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/hero-images');
        const data = await response.json();
        if (Array.isArray(data)) {
          setImages(data);
        }
      } catch (error) {
        console.error('Erro ao carregar imagens do carrossel:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [imagesOverride]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, [images]);

  if (loading) {
    return <div className={styles.loader}>Carregando momentos...</div>;
  }

  if (images.length === 0) {
    return <div className={styles.fallback}></div>;
  }

  return (
    <div className={styles.carouselContainer}>
      {images.map((url, index) => (
        <div
          key={url}
          className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
          style={{ backgroundImage: `url(${url})` }}
        />
      ))}
      <div className={styles.overlay}></div>
    </div>
  );
}
