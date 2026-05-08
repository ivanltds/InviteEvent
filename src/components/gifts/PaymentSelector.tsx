'use client';

import { useState } from 'react';
import styles from './PaymentSelector.module.css';
import { motion } from 'framer-motion';

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
          <div className={styles.pixArea}>
            <div className={styles.qrCodeContainer}>
              {pixPayload ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`} 
                  alt="QR Code PIX" 
                  className={styles.qrCode}
                />
              ) : (
                <div className={styles.qrPlaceholder}>Gerando QR Code...</div>
              )}
            </div>
            
            <div className={styles.pixInstructions}>
              <p>1. Abra o app do seu banco</p>
              <p>2. Escolha pagar via PIX (Copia e Cola ou QR Code)</p>
              <p>3. Confirme o valor de <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
            </div>

            <button 
              className={styles.copyBtn}
              onClick={onPixCopy}
              style={{ backgroundColor: accentColor }}
            >
              {pixCopyStatus === 'copied' ? '✓ Código Copiado' : 'Copiar Código PIX'}
            </button>
          </div>
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
