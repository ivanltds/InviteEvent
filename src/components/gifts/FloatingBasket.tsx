'use client';

import { motion, AnimatePresence } from 'framer-motion';
import styles from './FloatingBasket.module.css';

interface FloatingBasketProps {
  count: number;
  total: number;
  onClick: () => void;
  accentColor?: string;
}

export default function FloatingBasket({ count, total, onClick, accentColor }: FloatingBasketProps) {
  if (count === 0) return null;

  return (
    <motion.div 
      className={styles.container}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className={styles.basket} style={{ background: accentColor || 'var(--accent-gold)' }}>
        <div className={styles.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <motion.span 
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={styles.badge}
          >
            {count}
          </motion.span>
        </div>
        <div className={styles.text}>
          <span className={styles.label}>Ver Carrinho</span>
          <span className={styles.amount}>R$ {total.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </motion.div>
  );
}
