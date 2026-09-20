'use client';

import { useState } from 'react';
import styles from './PaymentSelector.module.css';
import { motion } from 'framer-motion';
import PixPanel from '@/components/shared/PixPanel';

interface PaymentSelectorProps {
  total: number;
  pixPayload: string;
  onPixCopy: () => void;
  pixCopyStatus: 'idle' | 'copied';
  accentColor?: string;
  allowStripe?: boolean;
}

export default function PaymentSelector({
  total,
  pixPayload,
  onPixCopy,
  pixCopyStatus,
  accentColor,
  allowStripe = false
}: PaymentSelectorProps) {
  const [method, setMethod] = useState<'pix' | 'stripe'>('pix');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${method === 'pix' ? styles.active : ''}`}
          onClick={() => setMethod('pix')}
          style={method === 'pix' ? { borderColor: accentColor, color: accentColor } : {}}
        >
          Pagar via PIX
        </button>
        {allowStripe && (
          <button 
            className={`${styles.tab} ${method === 'stripe' ? styles.active : ''}`}
            onClick={() => setMethod('stripe')}
            style={method === 'stripe' ? { borderColor: accentColor, color: accentColor } : {}}
          >
            Cartão de Crédito
          </button>
        )}
      </div>

      <div className={styles.content}>
        {method === 'pix' ? (
          <PixPanel
            pixPayload={pixPayload}
            onCopy={onPixCopy}
            copyStatus={pixCopyStatus}
            accentColor={accentColor}
            total={total}
          />
        ) : (
          <div className={styles.stripeArea}>
            <p>Integração com Stripe em breve...</p>
            <div className={styles.stripeMock}>
              <div className={styles.cardInputMock}></div>
              <button className={styles.payBtn} disabled style={{ backgroundColor: accentColor }}>
                Pagar com Cartão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
