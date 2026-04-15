'use client';

import { CldUploadWidget } from 'next-cloudinary';
import styles from './HeroImagesManager.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroImagesManagerProps {
  images: string[];
  onImagesChange: (newImages: string[]) => void;
  accentColor?: string;
}

export default function HeroImagesManager({ images, onImagesChange, accentColor }: HeroImagesManagerProps) {
  const handleUploadSuccess = (result: any) => {
    const url = result?.info?.secure_url;
    if (url) {
      onImagesChange([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Fotos do Banner (Hero)</h3>
        <p>Estas fotos aparecerão no carrossel inicial do seu convite.</p>
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
              <img src={url} alt={`Hero ${index + 1}`} />
              <button 
                type="button" 
                className={styles.removeBtn}
                onClick={() => removeImage(index)}
                title="Remover imagem"
              >
                &times;
              </button>
              <div className={styles.badge}>{index + 1}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        <CldUploadWidget 
          uploadPreset="invite_preset" 
          onSuccess={handleUploadSuccess}
          options={{
            maxFiles: 10,
            clientAllowedFormats: ['jpg', 'png', 'webp', 'jpeg'],
            maxFileSize: 5000000, // 5MB
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
                <p>Adicionar Foto</p>
              </div>
            </button>
          )}
        </CldUploadWidget>
      </div>
    </div>
  );
}
