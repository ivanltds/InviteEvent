'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './GSAPEnvelopeV3.module.css';
import { GatewayProps } from './GatewayTypes';

const STORAGE_KEY_PREFIX = 'envelope_opened_';

export default function GSAPEnvelopeV3({
  slug,
  bgPrimary = '#FDFBF7',
  textMain = '#2A2A2A',
  accentColor = '#C5A059',
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  fontCursive = "'Great Vibes', cursive",
  fontSerif = "'Cinzel', serif",
  heroImages = [],
  onComplete
}: GatewayProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  // Prepara imagem de capa
  const coverImage = heroImages && heroImages.length > 0
    ? heroImages[0]
    : 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=2000';

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const floatAnim = gsap.to(wrapperRef.current, {
      y: 10,
      duration: 2.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

    const xTo = gsap.quickTo(wrapperRef.current, "rotationY", { duration: 0.8, ease: "power3.out" });
    const yTo = gsap.quickTo(wrapperRef.current, "rotationX", { duration: 0.8, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive) return;
      const xAxis = (window.innerWidth / 2 - e.pageX) / 30;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 30;
      xTo(-xAxis);
      yTo(yAxis);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      floatAnim.kill();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isActive]);

  const handleOpen = () => {
    if (!isActive) return;
    setIsActive(false);

    // Para a flutuação inicial
    gsap.killTweensOf(wrapperRef.current);
    
    gsap.to(wrapperRef.current, { rotationX: 0, rotationY: 0, y: 0, duration: 0.5, ease: "power2.out" });
    gsap.to(`.${styles.hint}`, { autoAlpha: 0, duration: 0.3 });
    gsap.to(`.${styles.skipBtn}`, { autoAlpha: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => {
        try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
        onComplete();
      }
    });

    tl.to(`.${styles.waxSeal}`, { scale: 1.15, duration: 0.2, ease: "back.out(2)" }, 0)
      .to(`.${styles.waxLeft}`, { x: -60, y: 100, rotation: -30, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.25)
      .to(`.${styles.waxRight}`, { x: 60, y: 100, rotation: 30, autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.25)
      
      .to(`.${styles.topFlapContainer}`, { rotateX: 180, duration: 1.1, ease: "power3.inOut" }, 0.4)
      .set(`.${styles.topFlapContainer}`, { zIndex: 1 }, 0.95)

      .to(`.${styles.envelopeBody}`, { rotateX: 15, duration: 0.4, ease: "sine.out" }, 0.4)
      .to(`.${styles.envelopeBody}`, { rotateX: 0, duration: 0.7, ease: "sine.inOut" }, 0.8)
      .to(`.${styles.dynamicShadow}`, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 0.6)

      .to(`.${styles.card}`, { 
        y: -430, 
        duration: 1.2, 
        ease: "power2.inOut",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
      }, 1.1)
      .to(`.${styles.envelopeBody}`, { y: 80, duration: 1.2, ease: "power2.inOut" }, 1.1)

      .set(`.${styles.card}`, { zIndex: 20 }, 2.3)

      .to(`.${styles.card}`, {
        y: -140,
        z: 80,
        scale: 1.1,
        duration: 1.2,
        ease: "power3.out",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
      }, 2.3)
      .to(`.${styles.envelopeBody}`, {
        z: -150,
        y: 180,
        rotationX: -10,
        opacity: 0.5,
        duration: 1.2,
        ease: "power3.out"
      }, 2.3)

    // Pausa para leitura e mergulho final
      .to(`.${styles.card}`, { scale: 5, autoAlpha: 0, duration: 1.8, ease: "power3.inOut" }, 5.0)
      .to(`.${styles.envelopeBody}`, { z: -1000, y: 400, autoAlpha: 0, duration: 1.8, ease: "power3.inOut" }, 5.0)
      // Remove a opacidade do fundo para revelar a página real do Next.js
      .to(wrapperRef.current?.parentElement || `.${styles.root}`, { backgroundColor: "transparent", duration: 2, ease: "power2.inOut" }, 5.0);
  };

  const handleSkip = () => {
    try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
    onComplete();
  };

  const containerVars = {
    '--gold': accentColor,
    '--gold-light': `${accentColor}99`, // opacity applied
    '--env-dark': '#121212', 
    '--env-light': '#242424',
    '--paper-bg': bgPrimary,
    '--paper-dark': bgPrimary, 
    '--ink': textMain,
    '--font-cursive': fontCursive,
    '--font-serif': fontSerif,
  } as React.CSSProperties;

  return (
    <div className={styles.root} style={containerVars}>
      {showSkip && isActive && (
        <button className={styles.skipBtn} onClick={handleSkip}>
          Pular Animação →
        </button>
      )}

      <div className={styles.scene}>
        <div className={styles.envelopeWrapper} ref={wrapperRef} onClick={handleOpen}>
          <div className={styles.envelopeBody}>
            {/* COSTAS */}
            <svg className={`${styles.svgLayer} ${styles.back}`} viewBox="0 0 600 400" preserveAspectRatio="none">
              <rect width="600" height="400" rx="2" ry="2" />
            </svg>

            {/* CARTÃO */}
            <div className={styles.card}>
              <div className={styles.cardBorderOuter} style={{ borderColor: accentColor }}></div>
              <div className={styles.cardBorderInner} style={{ borderColor: accentColor }}></div>
              <div className={styles.cardContent}>
                <div className={styles.cardTopText}>O INÍCIO DE SEMPRE</div>
                <h2 style={{ color: accentColor }}>{coupleNoiva} & {coupleNoivo}</h2>
                <div className={styles.cardDivider} style={{ backgroundColor: accentColor }}></div>
                <div className={styles.cardDate}>{date}</div>
              </div>
            </div>

            <div className={styles.dynamicShadow}></div>

            {/* ABAS FRONTAIS */}
            <svg className={`${styles.svgLayer} ${styles.flapsFront}`} viewBox="0 0 600 400" preserveAspectRatio="none">
              <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
                <path d="M 0 0 L 0 400 L 320 220 L 300 200 Z" fill="var(--env-light)" />
                <path d="M 600 0 L 600 400 L 280 220 L 300 200 Z" fill="var(--env-light)" />
                <path d="M 0 400 L 600 400 L 320 180 Q 300 165 280 180 Z" fill="#1C1C1C" />
              </g>
            </svg>

            {/* ABA SUPERIOR */}
            <div className={styles.topFlapContainer}>
              <svg className={styles.topFlapBack} viewBox="0 0 600 260" preserveAspectRatio="none">
                <path d="M 0 0 L 600 0 L 330 240 Q 300 260 270 240 Z" fill="var(--env-dark)" />
              </svg>
              <svg className={styles.topFlapFront} viewBox="0 0 600 260" preserveAspectRatio="none">
                <path d="M 0 0 L 600 0 L 330 240 Q 300 260 270 240 Z" fill="var(--env-light)"/>
                <path d="M 0 0 L 600 0 L 330 240 Q 300 260 270 240 Z" stroke="var(--gold)" strokeWidth="1.5" fill="none" opacity="0.4"/>
              </svg>

              {/* LACRE */}
              <div className={styles.waxSeal}>
                <div className={`${styles.waxHalf} ${styles.waxLeft}`}>
                  <div className={styles.waxDesign}>
                    <div className={styles.waxInner} style={{ background: `radial-gradient(circle at 35% 35%, ${accentColor}, #2A0202 100%)` }}>
                      <span className={styles.waxText}>{coupleNoiva[0] || '?'}&{coupleNoivo[0] || '?'}</span>
                    </div>
                  </div>
                </div>
                <div className={`${styles.waxHalf} ${styles.waxRight}`}>
                  <div className={styles.waxDesign}>
                    <div className={styles.waxInner} style={{ background: `radial-gradient(circle at 35% 35%, ${accentColor}, #2A0202 100%)` }}>
                      <span className={styles.waxText}>{coupleNoiva[0] || '?'}&{coupleNoivo[0] || '?'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.hint}>TOQUE PARA ABRIR</div>
        </div>
      </div>
    </div>
  );
}
