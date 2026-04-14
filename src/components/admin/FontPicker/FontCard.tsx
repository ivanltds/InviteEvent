'use client';
/**
 * STORY-057: FontPicker — Seletor Visual de Fontes Premium
 * Atom: FontCard — card individual de seleção de fonte com preview lazy-loaded
 */
import { useEffect } from 'react';
import { FontOption, getCategoryLabel, getFontUrl } from '@/lib/constants/fonts';
import styles from './FontPicker.module.css';

interface FontCardProps {
  font: FontOption;
  isSelected: boolean;
  previewText: string;
  onSelect: (font: FontOption) => void;
}

export default function FontCard({ font, isSelected, previewText, onSelect }: FontCardProps) {
  // Lazy load da fonte apenas para o preview deste card (texto otimizado)
  useEffect(() => {
    if ((window as any).isPlaywright) return;

    const url = getFontUrl(font.googleFamily, previewText);
    const existing = document.querySelector(`link[data-font="${font.googleFamily}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-font', font.googleFamily);
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(link);
      }
    }
  }, [font.googleFamily, previewText]);

  return (
    <button
      data-testid={`font-card-${font.name.replace(/\s+/g, '-').toLowerCase()}`}
      className={`${styles.fontCard} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(font)}
      aria-label={`Selecionar fonte ${font.name}`}
      aria-pressed={isSelected}
      type="button"
    >
      <div className={styles.fontCardHeader}>
        <span className={styles.fontName}>{font.name}</span>
        {(font.category === 'dramatic' || font.category === 'ultra-dramatic') && (
          <span className={styles.categoryBadge}>
            {font.category === 'ultra-dramatic' ? '✦' : '★'}
          </span>
        )}
      </div>

      <div
        className={styles.fontPreview}
        style={{ fontFamily: font.cssValue }}
        aria-hidden="true"
      >
        {previewText}
      </div>

      <div className={styles.categoryLabel}>
        {getCategoryLabel(font.category)}
      </div>

      {isSelected && (
        <div className={styles.selectedIndicator} aria-hidden="true">✓</div>
      )}
    </button>
  );
}
