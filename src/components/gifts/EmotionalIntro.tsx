'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './EmotionalIntro.module.css';

const INTRO_MESSAGES = [
  { title: "Nosso Novo Lar", text: "Cada item aqui é um tijolo no nosso sonho que você torna realidade." },
  { title: "Sua Presença é Tudo", text: "Sua amizade é nosso maior presente, mas se quiser nos ajudar a construir nossa história..." },
  { title: "Um Toque de Carinho", text: "Preparamos esta lista para que você sinta que faz parte de cada cantinho da nossa casa." },
  { title: "Gratidão", text: "Obrigado por caminhar conosco nesta jornada incrível!" }
];

interface EmotionalIntroProps {
  onComplete: () => void;
  accentColor?: string;
}

export default function EmotionalIntro({ onComplete, accentColor }: EmotionalIntroProps) {
  const [message] = useState(() => 
    INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)]
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={styles.content}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="cursive" style={{ color: accentColor || 'var(--accent-gold)' }}>
              {message.title}
            </h2>
            <p>{message.text}</p>
            <motion.div 
              className={styles.loader}
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
              style={{ background: accentColor || 'var(--accent-gold)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
