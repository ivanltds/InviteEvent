'use client';

import styles from './PixPanel.module.css';

interface PixPanelProps {
  pixPayload: string;
  onCopy: () => void;
  copyStatus: 'idle' | 'copied';
  accentColor?: string;
  /** Quando informado, mostra o valor exato a confirmar (fluxo de presente com preço fixo). */
  total?: number;
  /** Nome do evento/contexto, usado só para compor o `alt` do QR code (acessibilidade). */
  qrAltLabel?: string;
}

/**
 * Miolo de pagamento PIX (QR code + instruções + copiar código), extraído
 * de PaymentSelector em 20/09/2026 para ser reaproveitado também pela
 * Gravata dos Noivos, que não tem "total" fixo nem aba de cartão — ver
 * docs/analise/04b-guia-de-extensao.md.
 */
export default function PixPanel({
  pixPayload,
  onCopy,
  copyStatus,
  accentColor,
  total,
  qrAltLabel,
}: PixPanelProps) {
  return (
    <div className={styles.pixArea}>
      <div className={styles.qrCodeContainer}>
        {pixPayload ? (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`}
            alt={`QR Code para pagamento via PIX${qrAltLabel ? ` de ${qrAltLabel}` : ''}`}
            className={styles.qrCode}
            width={180}
            height={180}
          />
        ) : (
          <div className={styles.qrPlaceholder}>Gerando QR Code...</div>
        )}
      </div>

      <div className={styles.pixInstructions}>
        <p>1. Abra o app do seu banco</p>
        <p>2. Escolha pagar via PIX (Copia e Cola ou QR Code)</p>
        {total !== undefined && total > 0 ? (
          <p>
            3. Confirme o valor de{' '}
            <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </p>
        ) : (
          <p>3. Escolha o valor que quiser contribuir</p>
        )}
      </div>

      <button className={styles.copyBtn} onClick={onCopy} style={{ backgroundColor: accentColor }}>
        <span aria-live="polite">{copyStatus === 'copied' ? '✓ Código Copiado' : 'Copiar Código PIX'}</span>
      </button>
    </div>
  );
}
