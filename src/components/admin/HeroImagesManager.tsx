'use client';

import { CldUploadWidget } from 'next-cloudinary';
import styles from './HeroImagesManager.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroImagesManagerProps {
  images: string[];
  videos?: string[];
  onImagesChange: (newImages: string[]) => void;
  onVideosChange?: (newVideos: string[]) => void;
  accentColor?: string;
}

import { useRef, useEffect } from 'react';

export default function HeroImagesManager({ images, videos = [], onImagesChange, onVideosChange, accentColor }: HeroImagesManagerProps) {
  const imagesRef = useRef(images);
  const videosRef = useRef(videos);

  useEffect(() => {
    imagesRef.current = images;
    videosRef.current = videos;
  }, [images, videos]);

  const handleUploadSuccess = (result: any) => {
    const url = result?.info?.secure_url;
    const resourceType = result?.info?.resource_type;
    
    if (url) {
      if (resourceType === 'video' && onVideosChange) {
        const nextVideos = [...videosRef.current, url];
        videosRef.current = nextVideos;
        onVideosChange(nextVideos);
      } else {
        const nextImages = [...imagesRef.current, url];
        imagesRef.current = nextImages;
        onImagesChange(nextImages);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const removeVideo = (index: number) => {
    if (!onVideosChange) return;
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    onVideosChange(newVideos);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Mídias do Banner (Hero)</h3>
        <p>Estas fotos e vídeos aparecerão no carrossel inicial do seu convite.</p>
      </div>

      <div className={styles.grid}>
        <AnimatePresence>
          {images.map((url, index) => (
            <motion.div 
              key={url} 
              className={styles.imageCard}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              <img src={url} alt={`Hero Foto ${index + 1}`} />
              <button 
                type="button" 
                className={styles.removeBtn}
                onClick={() => removeImage(index)}
                title="Remover foto"
              >
                &times;
              </button>
              <div className={styles.badge}>Foto {index + 1}</div>
            </motion.div>
          ))}
          
          {videos.map((url, index) => (
            <motion.div 
              key={url} 
              className={styles.imageCard}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              <video src={url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                type="button" 
                className={styles.removeBtn}
                onClick={() => removeVideo(index)}
                title="Remover vídeo"
              >
                &times;
              </button>
              <div className={styles.badge} style={{ background: 'rgba(197, 160, 89, 0.9)' }}>Vídeo {index + 1}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        <CldUploadWidget 
          uploadPreset="invite_preset" 
          onSuccess={handleUploadSuccess}
          options={{
            multiple: true,
            maxFiles: 50,
            clientAllowedFormats: ['jpg', 'png', 'webp', 'jpeg', 'mp4', 'mov', 'webm'],
            maxFileSize: 15000000, // 15MB
          }}
        >
          {({ open }) => (
            <button 
              type="button" 
              className={styles.addBtn} 
              onClick={() => open()}
              style={{ borderColor: accentColor }}
            >
              <div className={styles.addContent}>
                <span>+</span>
                <p>Mídia (Foto/Vídeo)</p>
              </div>
            </button>
          )}
        </CldUploadWidget>
      </div>
    </div>
  );
}
