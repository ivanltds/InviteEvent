'use client';
/**
 * STORY-056: EnvelopeGateway — Experiência Cinematográfica de Abertura do Convite
 *
 * Fases:
 * 1. ENVELOPE — envelope fechado com selo pulsante
 * 2. OPENING — animação de abertura (CSS transform)
 * 3. REVEAL — sequência de 3 frames de texto animado
 * 4. DONE — transição para o convite completo
 */
import { useState, useEffect, useCallback } from 'react';
import styles from './EnvelopeGateway.module.css';

type Phase = 'envelope' | 'opening' | 'reveal-1' | 'reveal-2' | 'reveal-3' | 'done';

interface EnvelopeGatewayProps {
  slug: string;
  bgPrimary?: string;     // Cor de fundo configurada
  textMain?: string;      // Cor de texto principal
  accentColor?: string;   // Cor do selo (accent_color do evento)
  coupleNoiva?: string;   // Nome da noiva
  coupleNoivo?: string;   // Nome do noivo
  date?: string;          // Data formatada ex: "13 de Junho de 2026"
  fontCursive?: string;   // CSS value da fonte cursiva
  fontSerif?: string;     // CSS value da fonte serifada
  onComplete: () => void; // Chamado quando a animação termina
}

const STORAGE_KEY_PREFIX = 'envelope_opened_';
const FRAME_DURATION = 3000; // ms por frame de revelação (aumentado para 3s para mais fluidez)

export default function EnvelopeGateway({
  slug,
  bgPrimary = '#fdfbf7',
  textMain = '#4a4a4a',
  accentColor = '#c8943a',
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  fontCursive = "'Pinyon Script', cursive",
  fontSerif = "'Playfair Display', serif",
  onComplete,
}: EnvelopeGatewayProps) {
  const [phase, setPhase] = useState<Phase>('envelope');
  const [showSkip, setShowSkip] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detectar prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
      onComplete(); // Skip imediato se reduced motion estiver ativado
      return;
    }
  }, [onComplete]);

  // Mostrar botão "Pular" após 1 segundo
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Progressão automática entre frames de revelação
  useEffect(() => {
    if (phase === 'reveal-1') {
      const t = setTimeout(() => setPhase('reveal-2'), FRAME_DURATION);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal-2') {
      const t = setTimeout(() => setPhase('reveal-3'), FRAME_DURATION);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal-3') {
      const t = setTimeout(() => {
        setPhase('done');
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
        } catch (_) { /* storage blocked */ }
        setTimeout(onComplete, 900); // Pausa maior antes de revelar o convite (fluidez)
      }, FRAME_DURATION + 500);
      return () => clearTimeout(t);
    }
  }, [phase, slug, onComplete]);

  const handleOpen = useCallback(() => {
    setPhase('opening');
    // Após a animação de abertura, iniciar revelação (1.4s para a abertura ser fluída)
    setTimeout(() => setPhase('reveal-1'), 1400);
  }, []);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
    } catch (_) { /* storage blocked */ }
    setPhase('done');
    setTimeout(onComplete, 300);
  }, [slug, onComplete]);

  if (reducedMotion) return null;

  return (
    <div
      className={styles.gateway}
      role="dialog"
      aria-label="Abrindo seu convite de casamento"
      aria-live="polite"
      style={{
        background: bgPrimary,
        color: textMain
      }}
    >
      {/* Botão de pular */}
      {showSkip && phase !== 'done' && (
        <button
          data-testid="skip-btn"
          className={styles.skipBtn}
          onClick={handleSkip}
          aria-label="Pular animação e ir direto ao convite"
        >
          Pular →
        </button>
      )}

      {/* FASE 1: Envelope fechado */}
      {phase === 'envelope' && (
        <div
          className={styles.envelopeWrapper}
          onClick={handleOpen}
          data-testid="open-envelope"
          role="button"
          aria-label="Toque para abrir seu convite"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
        >
          {/* SVG do envelope */}
          <svg
            className={styles.envelopeSvg}
            viewBox="0 0 340 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Corpo do envelope */}
            <rect x="2" y="2" width="336" height="236" rx="8" fill="#f5f0e8" stroke="#e8dfc8" strokeWidth="2"/>
            {/* Flap triangular fechado */}
            <path d="M2 2 L170 130 L338 2 Z" fill="#ede5d0" stroke="#e8dfc8" strokeWidth="1"/>
            {/* Dobras laterais */}
            <path d="M2 2 L2 238 L170 130 Z" fill="#ece4cf"/>
            <path d="M338 2 L338 238 L170 130 Z" fill="#e8dfc8"/>
            {/* Base */}
            <path d="M2 238 L170 130 L338 238 Z" fill="#f0e8d5"/>
            {/* Linhas de detalhe */}
            <line x1="2" y1="238" x2="338" y2="238" stroke="#ddd0b8" strokeWidth="1" opacity="0.5"/>
          </svg>

          {/* Selo de cera */}
          <div
            className={styles.seal}
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          >
            <span className={styles.sealText} style={{ fontFamily: fontCursive }}>
              {coupleNoiva[0]}{coupleNoivo[0]}
            </span>
          </div>

          <span className={styles.ctaText} style={{ fontFamily: fontSerif }}>
            toque para abrir
          </span>
        </div>
      )}

      {/* FASE 2: Abrindo (mostramos apenas flap animado via CSS) */}
      {phase === 'opening' && (
        <div className={styles.envelopeWrapper} aria-hidden="true">
          <svg className={styles.envelopeSvg} viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="336" height="236" rx="8" fill="#f5f0e8" stroke="#e8dfc8" strokeWidth="2"/>
            <path d="M2 238 L170 130 L338 238 Z" fill="#f0e8d5"/>
            <path d="M2 2 L2 238 L170 130 Z" fill="#ece4cf"/>
            <path d="M338 2 L338 238 L170 130 Z" fill="#e8dfc8"/>
            {/* Flap em processo de abertura */}
            <path
              d="M2 2 L170 130 L338 2 Z"
              fill="#ede5d0"
              stroke="#e8dfc8"
              strokeWidth="1"
              style={{
                transformOrigin: 'top center',
                animation: 'flapOpen 0.7s ease-in-out forwards',
              }}
            />
          </svg>
          <div className={styles.seal} style={{ backgroundColor: accentColor }} aria-hidden="true">
            <span className={styles.sealText} style={{ fontFamily: fontCursive }}>
              {coupleNoiva[0]}{coupleNoivo[0]}
            </span>
          </div>
        </div>
      )}

      {/* FASE 3 — Frame 1: "Você foi convidado" */}
      {phase === 'reveal-1' && (
        <div className={styles.revealFrame} aria-live="assertive">
          <p className={`${styles.frameTitle}`} style={{ fontFamily: fontCursive, color: accentColor }}>
            Você foi convidado
          </p>
        </div>
      )}

      {/* FASE 3 — Frame 2: "Para celebrar esta união" */}
      {phase === 'reveal-2' && (
        <div className={styles.revealFrame} aria-live="assertive">
          {/* Decorações botânicas SVG */}
          <svg className={`${styles.botanical} ${styles.botanicalLeft}`} width="120" height="200" viewBox="0 0 120 200" aria-hidden="true">
            <path d="M60 200 Q20 150 40 100 Q60 50 60 0" stroke="rgba(200,190,160,0.4)" strokeWidth="1.5" fill="none"/>
            <path d="M40 100 Q10 80 20 60" stroke="rgba(200,190,160,0.3)" strokeWidth="1" fill="none"/>
            <path d="M50 130 Q15 110 25 85" stroke="rgba(200,190,160,0.3)" strokeWidth="1" fill="none"/>
          </svg>

          <p className={styles.frameTitleSerif} style={{ fontFamily: fontSerif, color: textMain }}>
            Para celebrar
          </p>
          <p className={`${styles.frameTitle}`} style={{ fontFamily: fontCursive, color: accentColor }}>
            esta união
          </p>

          <svg className={`${styles.botanical} ${styles.botanicalRight}`} width="120" height="200" viewBox="0 0 120 200" aria-hidden="true">
            <path d="M60 200 Q100 150 80 100 Q60 50 60 0" stroke="rgba(200,190,160,0.4)" strokeWidth="1.5" fill="none"/>
            <path d="M80 100 Q110 80 100 60" stroke="rgba(200,190,160,0.3)" strokeWidth="1" fill="none"/>
            <path d="M70 130 Q105 110 95 85" stroke="rgba(200,190,160,0.3)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
      )}

      {/* FASE 3 — Frame 3: Nomes + Data */}
      {phase === 'reveal-3' && (
        <div className={styles.revealFrame} aria-live="assertive">
          <p
            className={styles.namePrimary}
            style={{ fontFamily: fontCursive, color: accentColor }}
          >
            {coupleNoiva}{' '}
            <span className={styles.nameAnd} style={{ color: textMain }}>&</span>{' '}
            {coupleNoivo}
          </p>
          {date && (
            <p className={styles.nameDate} style={{ fontFamily: fontSerif, color: textMain }}>
              {date}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
