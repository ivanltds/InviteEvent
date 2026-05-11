'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './GSAPCinematic.module.css';
import { GatewayProps } from './GatewayTypes';

const STORAGE_KEY_PREFIX = 'envelope_opened_';

export default function GSAPCinematic({
  slug,
  bgPrimary = '#F8F4ED',
  textMain = '#1A1614',
  accentColor = '#C9A84C',
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  fontCursive = "'Great Vibes', cursive",
  fontSerif = "'Cinzel', serif",
  heroImages = [],
  onComplete
}: GatewayProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  
  const [isInteractive, setIsInteractive] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const coverImage = heroImages && heroImages.length > 0
    ? heroImages[0]
    : 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=2000';

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Spawn ambient particles once
  useEffect(() => {
    if (!ambientRef.current) return;
    const container = ambientRef.current;
    for (let i = 0; i < 35; i++) {
      const d = document.createElement('div');
      d.className = styles.ambientDot;
      const size = 1 + Math.random() * 3;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      d.style.left = `${Math.random() * 100}%`;
      d.style.bottom = `${Math.random() * 30}%`;
      // Inline delay random para animação CSS float-ambient
      d.style.animationDuration = `${8 + Math.random() * 12}s`;
      d.style.animationDelay = `${Math.random() * 8}s`;
      container.appendChild(d);
    }
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Intro Timeline
    const introTl = gsap.timeline({ onComplete: () => setIsInteractive(true) });

    gsap.set(wrapperRef.current, { y: 40, opacity: 0 });

    introTl.to(`.${styles.spotlight}`, { opacity: 1, duration: 2, ease: "power2.out" }, 0)
      .to(wrapperRef.current, { opacity: 1, y: 0, duration: 2, ease: "power3.out" }, 0.5)
      .to(`.${styles.hint}`, { opacity: 1, duration: 1, ease: "power2.out" }, 2)
      .add(() => {
         gsap.to(wrapperRef.current, { y: 12, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, id: "floatCinematic" });
      }, 2.5);

    const xTo = gsap.quickTo(wrapperRef.current, "rotationY", {duration: 1, ease: "power3.out"});
    const yTo = gsap.quickTo(wrapperRef.current, "rotationX", {duration: 1, ease: "power3.out"});

    const handleMove = (e: MouseEvent) => {
      if (!isInteractive) return;
      xTo(-(window.innerWidth  / 2 - e.pageX) / 22);
      yTo( (window.innerHeight / 2 - e.pageY) / 22);
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      introTl.kill();
      gsap.getById("floatCinematic")?.kill();
    };
  }, [isInteractive]);

  const spawnExplosion = () => {
    if (!particlesContainerRef.current) return;
    const container = particlesContainerRef.current;
    const cx = 280, cy = 340; // Centro aproximado
    const COLORS = [accentColor, '#FFFFFF', '#E8C96A', '#7A0000']; 
    
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = styles.waxParticle;
      const size = 3 + Math.random() * 8;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.backgroundColor = color;
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.boxShadow = `0 0 4px 1px ${color}88`;
      
      container.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist  = 80 + Math.random() * 220;

      gsap.to(p, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist + Math.random() * 60,
        rotation: Math.random() * 720 - 360,
        opacity: 1,
        scale: Math.random() * 1.5 + 0.5,
        duration: 0.3,
        ease: "power3.out",
        delay: Math.random() * 0.15
      });

      gsap.to(p, {
        y: '+=' + (100 + Math.random() * 150),
        opacity: 0,
        duration: 0.8 + Math.random() * 0.6,
        ease: "power2.in",
        delay: 0.2 + Math.random() * 0.2,
        onComplete: () => p.remove()
      });
    }
  };

  const handleOpen = () => {
    if (!isInteractive) return;
    setIsInteractive(false);

    gsap.getById("floatCinematic")?.kill();
    gsap.to(wrapperRef.current, { rotationX: 0, rotationY: 0, y: 0, duration: 0.6, ease: "power2.out" });
    gsap.to(`.${styles.hint}`, { autoAlpha: 0, duration: 0.3 });
    gsap.to(`.${styles.skipBtn}`, { autoAlpha: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => {
        try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
        onComplete();
      }
    });

    /* 1. SCANNER */
    tl.to(`.${styles.scanLine}`, { opacity: 1, duration: 0.2 }, 0)
      .to(`.${styles.scanLine}`, { top: '100%', duration: 1.1, ease: "power1.inOut" }, 0.1)
      .to(`.${styles.scanLine}`, { opacity: 0, duration: 0.3 }, 1.1)
      .to(`.${styles.spotlight}`, { opacity: 1.8, duration: 0.8, ease: "power2.out" }, 0.2)
      .to(`.${styles.spotlight}`, { opacity: 1, duration: 0.8, ease: "power2.in"  }, 1.0)

    /* 2. LACRE PULSA */
      .to(`.${styles.waxSeal}`, { scale: 1.18, duration: 0.18, ease: "power2.out" }, 1.3)
      .to(`.${styles.waxSeal}`, { scale: 0.95, duration: 0.12, ease: "power2.in"  }, 1.48)
      .to(`.${styles.waxSeal}`, { scale: 1.22, duration: 0.15, ease: "power2.out" }, 1.60)
      .to(`.${styles.waxSeal}`, { scale: 1.0,  duration: 0.1,  ease: "power2.in"  }, 1.75)

    /* 3. EXPLOSÃO */
      .add(spawnExplosion, 1.85)
      .to(`.${styles.waxLeft}`,  { x: -80, y: 120, rotation: -40, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: "power3.in" }, 1.85)
      .to(`.${styles.waxRight}`, { x:  80, y: 120, rotation:  40, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: "power3.in" }, 1.85)

    /* 4. ABA */
      .to(`.${styles.topFlap}`, { rotateX: 180, duration: 1.4, ease: "power3.inOut" }, 2.2)
      .set(`.${styles.topFlap}`, { zIndex: 1 }, 2.9)
      .to(`.${styles.envBody}`, { rotateX: 18, rotateY: -4, duration: 0.5, ease: "sine.out" }, 2.2)
      .to(`.${styles.envBody}`, { rotateX: 0,  rotateY: 0,  duration: 1.0, ease: "sine.inOut" }, 2.7)
      .to(`.${styles.dynamicShadow}`, { opacity: 0, duration: 0.8, ease: "power1.inOut" }, 2.4)

    /* 5. CARTÃO SOBE */
      .to(`.${styles.card}`, { y: -380, z: 15, duration: 1.4, ease: "expo.inOut", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }, 3.4)
      .to(`.${styles.envBody}`, { y: 80, duration: 1.4, ease: "expo.inOut" }, 3.4)
      .set(`.${styles.card}`, { zIndex: 20 }, 4.8)

    /* 6. REVELA TEXTOS */
      .to(`.${styles.line1}`, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.8)
      .to(`.${styles.line2}`, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 4.2)
      .to(`.${styles.lineDivider}`, { opacity: 1, width: '60px', duration: 0.6, ease: "power2.out" }, 4.7)
      .to(`.${styles.line3}`, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 5.0)

    /* 7. FRENTE */
      .to(`.${styles.card}`, { y: -120, z: 90, scale: 1.1, duration: 1.2, ease: "power3.out", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }, 5.0)
      .to(`.${styles.envBody}`, { z: -160, opacity: 0.4, y: 150, duration: 1.2, ease: "power3.out" }, 5.0)
      .to(`.${styles.spotlight}`, { opacity: 0.6, duration: 1.5 }, 5.0)

    /* 8. BRILHO */
      .to(`.${styles.cardBorderInner}`, {
         opacity: 1.0, boxShadow: `0 0 15px 2px ${accentColor}66`, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 2
      }, 5.5)

    /* 9. MERGULHO FINAL */
      .to(`.${styles.card}`, { scale: 5, autoAlpha: 0, duration: 2, ease: "power3.inOut" }, 8.5)
      .to(`.${styles.envBody}`, { z: -800, y: 300, autoAlpha: 0, duration: 1.8, ease: "power3.inOut" }, 8.5)
      .to(`.${styles.spotlight}`, { opacity: 0, duration: 1.5 }, 8.5)
      // Fade out the overlay background to reveal the real website underneath
      .to(wrapperRef.current?.parentElement || `.${styles.root}`, { backgroundColor: "transparent", duration: 2.5, ease: "power2.inOut" }, 8.5);
  };

  const handleSkip = () => {
    try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
    onComplete();
  };

  const containerStyle = {
    '--gold': accentColor,
    '--gold-light': `${accentColor}CC`,
    '--gold-dim': accentColor,
    '--env-dark': '#0E0E0E',
    '--env-mid': '#1A1A1A',
    '--env-light': '#252525',
    '--paper': bgPrimary,
    '--ink': textMain,
    '--font-cursive': fontCursive,
    '--font-serif': fontSerif,
  } as React.CSSProperties;

  return (
    <div className={styles.root} style={containerStyle}>
      {showSkip && isInteractive && (
        <button className={styles.skipBtn} onClick={handleSkip}>Pular →</button>
      )}

      <div className={styles.spotlight} style={{ background: `radial-gradient(ellipse at bottom, ${accentColor}1F 0%, ${accentColor}0A 40%, transparent 70%)` }}></div>
      <div ref={ambientRef} id="ambientParticles" className={styles.ambientContainer}></div>

      <div className={styles.scene}>
        <div className={styles.envWrapper} ref={wrapperRef} onClick={handleOpen}>
          <div className={styles.envShadow}></div>

          <div className={styles.envBody}>
            <svg className={styles.svgLayer} style={{ fill: '#0E0E0E', zIndex: 1, transform: 'translateZ(-2px)' }} viewBox="0 0 560 380" preserveAspectRatio="none">
              <rect width="560" height="380" rx="3" />
            </svg>

            <div className={styles.scanLine}></div>

            <div className={styles.card}>
              <div className={styles.cardBorderOuter} style={{ borderColor: accentColor }}></div>
              <div className={styles.cardBorderInner} style={{ borderColor: accentColor }}></div>
              <div className={`${styles.cardLine} ${styles.cardTopText} ${styles.line1}`}>VOCÊ ESTÁ CONVIDADO</div>
              <div className={`${styles.cardLine} ${styles.line2}`}>
                <h2 style={{ color: textMain }}>{coupleNoiva} &<br/>{coupleNoivo}</h2>
              </div>
              <div className={`${styles.cardDivider} ${styles.lineDivider}`} style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}></div>
              <div className={`${styles.cardLine} ${styles.cardDate} ${styles.line3}`}>{date?.toUpperCase()}</div>
            </div>

            <div className={styles.dynamicShadow}></div>

            <svg className={styles.svgLayer} style={{ zIndex: 3, transform: 'translateZ(5px)', filter: 'drop-shadow(0 -5px 15px rgba(0,0,0,0.6))' }} viewBox="0 0 560 380" preserveAspectRatio="none">
              <g stroke={`${accentColor}10`} strokeWidth="1">
                <path d="M 0 0 L 0 380 L 305 210 L 280 188 Z" fill="#1A1A1A"/>
                <path d="M 560 0 L 560 380 L 255 210 L 280 188 Z" fill="#1A1A1A"/>
                <path d="M 0 380 L 560 380 L 305 172 Q 280 158 255 172 Z" fill="#111"/>
              </g>
            </svg>

            <svg className={styles.envOutline} viewBox="0 0 560 380" preserveAspectRatio="none">
              <rect width="560" height="380" rx="3" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.2"/>
            </svg>

            <div className={styles.topFlap}>
              <svg className={styles.flapBack} viewBox="0 0 560 250" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M 0 0 L 560 0 L 310 230 Q 280 250 250 230 Z" fill="#0A0A0A" />
              </svg>
              <svg className={styles.flapFront} viewBox="0 0 560 250" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M 0 0 L 560 0 L 310 230 Q 280 250 250 230 Z" fill="#1C1C1C"/>
                <path d="M 0 0 L 560 0 L 310 230 Q 280 250 250 230 Z" fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.35"/>
                <path d="M 0 0 L 560 0 L 310 230 Q 280 250 250 230 Z" fill="url(#flapGrad)" opacity="0.3"/>
              </svg>
              <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                  <linearGradient id="flapGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff"/>
                    <stop offset="100%" stopColor="transparent"/>
                  </linearGradient>
                </defs>
              </svg>

              <div className={styles.waxSeal}>
                <div className={`${styles.waxHalf} ${styles.waxLeft}`}>
                  <div className={styles.waxDesign}>
                    <div className={styles.waxInner} style={{ background: `radial-gradient(circle at 35% 35%, ${accentColor}, #2A0202 100%)` }}>
                      <span className={styles.waxText}>{coupleNoiva[0]}&{coupleNoivo[0]}</span>
                    </div>
                  </div>
                </div>
                <div className={`${styles.waxHalf} ${styles.waxRight}`}>
                  <div className={styles.waxDesign}>
                    <div className={styles.waxInner} style={{ background: `radial-gradient(circle at 35% 35%, ${accentColor}, #2A0202 100%)` }}>
                      <span className={styles.waxText}>{coupleNoiva[0]}&{coupleNoivo[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={particlesContainerRef} className={styles.waxParticlesContainer}></div>
          </div>

          <div className={styles.hint}>TOQUE PARA REVELAR</div>
        </div>
      </div>
    </div>
  );
}
