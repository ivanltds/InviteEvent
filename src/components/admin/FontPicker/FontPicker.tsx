'use client';
/**
 * STORY-057: FontPicker — Organism
 * Tabs de seleção cursiva/serifada com preview ao vivo.
 */
import { useState } from 'react';
import { CURSIVE_FONTS, SERIF_FONTS, FontOption } from '@/lib/constants/fonts';
import FontCard from './FontCard';
import styles from './FontPicker.module.css';

interface FontPickerProps {
  currentCursive: string;
  currentSerif: string;
  coupleNames: string;    // Ex: "Layslla & Marcus" — usado como preview text
  onCursiveChange: (cssValue: string) => void;
  onSerifChange: (cssValue: string) => void;
}

export default function FontPicker({
  currentCursive,
  currentSerif,
  coupleNames,
  onCursiveChange,
  onSerifChange,
}: FontPickerProps) {
  const [activeTab, setActiveTab] = useState<'cursive' | 'serif'>('cursive');

  const handleSelectCursive = (font: FontOption) => {
    onCursiveChange(font.cssValue);
  };

  const handleSelectSerif = (font: FontOption) => {
    onSerifChange(font.cssValue);
  };

  return (
    <div className={styles.fontPicker} data-testid="font-picker">
      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Seletor de fontes">
        <button
          role="tab"
          aria-selected={activeTab === 'cursive'}
          className={`${styles.tab} ${activeTab === 'cursive' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cursive')}
          id="tab-cursive"
        >
          ✍ Cursiva
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'serif'}
          className={`${styles.tab} ${activeTab === 'serif' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('serif')}
          id="tab-serif"
        >
          𝐒 Serifada
        </button>
      </div>

      {/* Description */}
      <p className={styles.tabDescription}>
        {activeTab === 'cursive'
          ? 'Usada no nome do casal e títulos principais. Fontes ★ Dramáticas criam impacto máximo.'
          : 'Usada nos textos do convite, detalhes e subtítulos. Escolha uma fonte elegante e legível.'}
      </p>

      {/* Font Grid */}
      <div
        className={styles.fontGrid}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'cursive' && CURSIVE_FONTS.map(font => (
          <FontCard
            key={font.googleFamily}
            font={font}
            isSelected={currentCursive === font.cssValue}
            previewText={coupleNames || 'Layslla & Marcus'}
            onSelect={handleSelectCursive}
          />
        ))}

        {activeTab === 'serif' && SERIF_FONTS.map(font => (
          <FontCard
            key={font.googleFamily}
            font={font}
            isSelected={currentSerif === font.cssValue}
            previewText="você foi convidado"
            onSelect={handleSelectSerif}
          />
        ))}
      </div>

      {/* Current selection summary */}
      <div className={styles.selectionSummary} aria-live="polite">
        <div>
          <span className={styles.summaryLabel}>Cursiva ativa:</span>
          <span
            className={styles.summaryPreview}
            style={{ fontFamily: currentCursive }}
          >
            {coupleNames}
          </span>
        </div>
        <div>
          <span className={styles.summaryLabel}>Serifada ativa:</span>
          <span
            className={styles.summaryPreview}
            style={{ fontFamily: currentSerif }}
          >
            você foi convidado
          </span>
        </div>
      </div>
    </div>
  );
}
