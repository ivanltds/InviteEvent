'use client';

import React from 'react';
import { Configuracao } from '@/lib/types/database';

interface ConfigPreviewProps {
  config: Partial<Configuracao>;
}

const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return '#ffffff';
  hexcolor = hexcolor.replace('#', '');
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(c => c + c).join('');
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#4a4a4a' : '#ffffff';
};

const ConfigPreview: React.FC<ConfigPreviewProps> = ({ config }) => {
  const styles = {
    container: {
      backgroundColor: config.bg_primary || '#fdfbf7',
      color: config.text_main || '#4a4a4a',
      padding: '2rem',
      borderRadius: '12px',
      border: `1px solid ${config.accent_color}33`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      position: 'sticky' as const,
      top: '2rem',
      overflow: 'hidden',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
    },
    names: {
      fontFamily: config.font_cursive || "'Pinyon Script', cursive",
      fontSize: '2.5rem',
      color: config.accent_color || '#8fa89b',
      marginBottom: '0.5rem',
      display: 'block',
    },
    date: {
      fontFamily: config.font_serif || "'Playfair Display', serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.2rem',
      opacity: 0.8,
    },
    section: {
      marginTop: '2rem',
      borderTop: `1px solid ${config.text_main}22`,
      paddingTop: '1.5rem',
    },
    title: {
      fontFamily: config.font_serif || "'Playfair Display', serif",
      fontSize: '1.5rem',
      marginBottom: '1rem',
    },
    text: {
      fontSize: '0.95rem',
      lineHeight: '1.6',
      opacity: 0.9,
    },
    button: {
      display: 'inline-block',
      marginTop: '1.5rem',
      padding: '0.6rem 1.5rem',
      backgroundColor: config.accent_color || '#8fa89b',
      color: getContrastColor(config.accent_color || '#8fa89b'),
      borderRadius: '4px',
      fontSize: '0.9rem',
      fontWeight: '500',
    }
  };

  return (
    <div style={styles.container} data-testid="config-preview">
      <div style={{ marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05rem', opacity: 0.5 }}>
        Pré-visualização do Site
      </div>
      
      <div style={styles.header}>
        <span style={styles.names}>
          {config.noiva_nome || 'Noiva'} & {config.noivo_nome || 'Noivo'}
        </span>
        <div style={styles.date}>13 de Junho de 2026</div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.title}>Nossa História</h3>
        <p style={styles.text}>
          Tudo começou de um jeito simples... Este é um exemplo de como seu texto aparecerá para os convidados.
        </p>
        <div style={styles.button}>Confirmar Presença</div>
      </div>

      {/* Font loaders for preview */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Pinyon+Script&family=Great+Vibes&family=Dancing+Script&family=Alex+Brush&family=Parisienne&family=Rochester&family=Italianno&family=Allura&family=Homemade+Apple&family=Marck+Script&family=Satisfy&family=Courgette&family=Lora&family=Cinzel&family=Cormorant+Garamond&family=EB+Garamond&family=Libre+Baskerville&family=Cardo&family=Marcellus&family=Prata&display=swap');
      `}} />
    </div>
  );
};

export default ConfigPreview;
