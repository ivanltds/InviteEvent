'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './EnvelopeGateway.module.css';

interface EnvelopeGatewayProps {
  slug: string;
  bgPrimary?: string;     // Cor de fundo configurada
  textMain?: string;      // Cor de texto principal
  accentColor?: string;   // Cor do selo (accent_color do evento)
  coupleNoiva?: string;   // Nome da noiva
  coupleNoivo?: string;   // Nome do noivo
  date?: string;          // Data formatada ex: "13 de Junho de 2026"
  rawDate?: string;       // Data bruta do casamento (ex: '2026-06-13')
  fontCursive?: string;   // CSS value da fonte cursiva
  fontSerif?: string;     // CSS value da fonte serifada
  heroImages?: string[];  // Capas oficiais do evento
  onComplete: () => void; // Chamado quando a animação termina
}

const STORAGE_KEY_PREFIX = 'envelope_opened_';

export default function EnvelopeGateway({
  slug,
  bgPrimary = '#F9F9FB',
  textMain = '#1A1A1A',
  accentColor = '#C5A059',
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  rawDate = '',
  fontCursive = "'Pinyon Script', cursive",
  fontSerif = "'Playfair Display', serif",
  heroImages = [],
  onComplete,
}: EnvelopeGatewayProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  
  // Contagem regressiva oficial dinâmica
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0 });

  useEffect(() => {
    if (!rawDate) return;
    
    const calculateTimeLeft = () => {
      const difference = +new Date(rawDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ dias: 0, horas: 0, minutos: 0 });
        return;
      }
      const dias = Math.floor(difference / (1000 * 60 * 60 * 24));
      const horas = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((difference / 1000 / 60) % 60);
      setTimeLeft({ dias, horas, minutos });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [rawDate]);

  // Usar a primeira imagem configurada no evento ou uma imagem padrão de casamento super romântica
  const finalCoverImage = heroImages && heroImages.length > 0 
    ? heroImages[0] 
    : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800';

  // Mostrar botão pular após 1s
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = useCallback(() => {
    if (step > 0) return;

    // Pre-load da imagem real do casal
    const img = new Image();
    img.src = finalCoverImage;
    img.onload = () => setImgLoaded(true);
    if (img.complete) setImgLoaded(true);

    // 1. Abre a aba do envelope
    setStep(1);

    // 2. Puxa a carta para fora
    setTimeout(() => {
      setStep(2);
    }, 800);

    // 3. Executa o flip tridimensional Y-180 revelando o convite miniatura mantendo as mesmas proporções horizontais
    setTimeout(() => {
      setStep(3);
    }, 5500);

    // 4. Revela os elementos internos da miniatura
    setTimeout(() => {
      setStep(4);
    }, 6200);

    // Finalizar com esmaecer (fade out) de toda a camada de gateway após o tempo estendido de leitura (14s total)
    setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
      } catch (_) {}
      onComplete();
    }, 14000);
  }, [step, slug, finalCoverImage, onComplete]);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
    } catch (_) {}
    onComplete();
  }, [slug, onComplete]);

  return (
    <div 
      className={`${styles.scene} ${styles[`step${step}`]}`}
      style={{
        '--bg-primary': bgPrimary,
        '--text-main': textMain,
        '--accent-color': accentColor,
        '--font-cursive': fontCursive,
        '--font-serif': fontSerif,
      } as React.CSSProperties}
    >
      {showSkip && step < 4 && (
        <button className={styles.skipBtn} onClick={handleSkip}>
          Pular Animação →
        </button>
      )}

      {/* ENVELOPE DE FUNDO */}
      <div className={styles.envelopeWrapper}>
        <div className={styles.envelopeBack}></div>
        <div className={styles.envelopeFront}></div>
        <div className={styles.envelopeTopFlap}></div>
        
        <div className={styles.seal} onClick={handleOpen}>
          <span style={{ fontFamily: fontCursive }}>
            {coupleNoiva[0] || 'M'}&{coupleNoivo[0] || 'J'}
          </span>
        </div>
        
        <span className={styles.ctaText}>
          toque para abrir
        </span>
      </div>

      {/* CARTA TRIDIMENSIONAL QUE SE VIRA E REVELA O CONVITE MINIATURA */}
      <div className={`${styles.flippingCardWrapper} ${step >= 2 ? styles.pulledOut : ''} ${step >= 3 ? styles.flipped : ''}`}>
        <div className={styles.flippingCardInner}>
          
          {/* FRENTE DA CARTA: "VOCÊ FOI CONVIDADO" COM CALIGRAFIA E FAÍSCAS MÁGICAS */}
          <div className={styles.flippingCardFront}>
            <div className={styles.letterSheet}>
              {/* Detalhes de cantos dourados */}
              <div className={styles.goldCornerTL} />
              <div className={styles.goldCornerTR} />
              <div className={styles.goldCornerBL} />
              <div className={styles.goldCornerBR} />
              
              <div className={styles.letterCore}>
                <p className={styles.letterLine1} style={{ fontFamily: fontSerif }}>Você foi convidado</p>
                <div className={styles.writingContainer}>
                  <p className={styles.letterLine2} style={{ fontFamily: fontCursive, color: accentColor }}>
                    para celebrar essa união
                  </p>
                  <span className={styles.floatingPen}>
                    🖋️
                    <span className={styles.magicGlow} />
                    <span className={styles.sparkle1}>✨</span>
                    <span className={styles.sparkle2}>✦</span>
                    <span className={styles.sparkle3}>✨</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* VERSO DA CARTA: MINIATURA DE ALTA FIDELIDADE DO CONVITE REAL (MANTENDO AS PROPORÇÕES DE PAISAGEM DA CARTA) */}
          <div className={styles.flippingCardBack}>
            <div className={styles.miniatureContainer} style={{ backgroundImage: `url('${finalCoverImage}')` }}>
              {/* Moldura dourada interna de luxo */}
              <div className={styles.goldFrame} />
              
              <div className={styles.miniatureGlassOverlay}>
                <h1 className={`${styles.msg} ${styles.delay1} ${styles.miniatureTitle}`} style={{ fontFamily: fontCursive }}>
                  {coupleNoiva} & {coupleNoivo}
                </h1>

                {/* Divisor dourado luxuoso */}
                <div className={`${styles.msg} ${styles.delay2} ${styles.goldDivider}`}>
                  <span className={styles.diamond}>✦</span>
                  <div className={styles.dividerLine} />
                  <span className={styles.diamond}>✦</span>
                </div>

                <p className={`${styles.msg} ${styles.delay2} ${styles.miniatureDate}`} style={{ fontFamily: fontSerif }}>
                  {date}
                </p>
                
                {/* Countdown 100% dinâmico idêntico ao da página real */}
                <div className={`${styles.msg} ${styles.delay3} ${styles.miniatureCountdown}`}>
                  <div className={styles.timeBox}>
                    <span>{timeLeft.dias}</span>
                    <label>dias</label>
                  </div>
                  <div className={styles.timeBox}>
                    <span>{timeLeft.horas}</span>
                    <label>horas</label>
                  </div>
                  <div className={styles.timeBox}>
                    <span>{timeLeft.minutos}</span>
                    <label>minutos</label>
                  </div>
                </div>

                <p className={`${styles.msg} ${styles.delay4} ${styles.miniatureTagline}`} style={{ fontFamily: fontSerif }}>
                  O nosso grande dia está chegando!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
