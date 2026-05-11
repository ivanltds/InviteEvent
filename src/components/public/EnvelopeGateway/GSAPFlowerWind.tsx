'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './GSAPFlowerWind.module.css';
import { GatewayProps } from './GatewayTypes';

const STORAGE_KEY_PREFIX = 'envelope_opened_';

export default function GSAPFlowerWind({
  slug,
  bgPrimary = '#FAFAF9',
  textMain = '#2A322E',
  accentColor = '#8FA89B', // Ex: tom de verde/rosa pastel do evento
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  fontCursive = "'Pinyon Script', cursive",
  fontSerif = "'Playfair Display', serif",
  heroImages = [],
  onComplete
}: GatewayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const windContainerRef = useRef<HTMLDivElement>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const coverImage = heroImages && heroImages.length > 0
    ? heroImages[0]
    : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000';

  // Gerar paleta harmônica a partir do accentColor (Simular HSL shifts via string injection ou fixar variações)
  // Pra simplificar, usaremos o accentColor puro, e versões com opacity nos SVGs para criar profundidade floral.

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Ambient Wind & Flower Float
  useEffect(() => {
    if (!rootRef.current) return;
    
    const floatTl = gsap.to(`.${styles.flowerCore}`, {
      y: 15,
      rotation: 2,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    gsap.to(`.${styles.petalBack}`, {
      scale: 1.03,
      rotation: '+=1',
      duration: 3,
      stagger: 0.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    return () => {
      floatTl.kill();
    };
  }, []);

  // Spawner de pétalas sopradas ao vento (Physics Simulation)
  const spawnWindPetals = () => {
    if (!windContainerRef.current) return;
    const container = windContainerRef.current;

    // Gerar cores variadas para as pétalas a partir do accent
    const petalPalette = [
      accentColor,
      `${accentColor}dd`, // Opacidade leve
      '#FFFFFF',         // Contraste branco
      '#F8F8F8'          // Off-white
    ];

    for (let i = 0; i < 45; i++) {
      const p = document.createElement('div');
      p.className = styles.physicsPetal;
      p.style.background = petalPalette[Math.floor(Math.random() * petalPalette.length)];
      p.style.opacity = '0';
      
      // Tamanhos e formas
      const sizeW = 10 + Math.random() * 15;
      const sizeH = 15 + Math.random() * 20;
      p.style.width = `${sizeW}px`;
      p.style.height = `${sizeH}px`;
      p.style.borderRadius = `${30 + Math.random()*50}% ${10 + Math.random()*20}% ${30 + Math.random()*50}% ${10 + Math.random()*20}%`;
      
      // Posição inicial central
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;

      container.appendChild(p);

      const duration = 2.5 + Math.random() * 2;
      const delay = Math.random() * 0.8;
      
      // Trajetória de arco
      const tx = 600 + Math.random() * 800;
      const ty = -200 - Math.random() * 400;

      gsap.to(p, {
        x: tx,
        y: ty,
        rotation: 360 + Math.random() * 720,
        rotationY: Math.random() * 360,
        opacity: Math.random() * 0.8 + 0.2,
        scale: Math.random() * 1.2 + 0.4,
        duration: duration,
        delay: delay,
        ease: "power1.out"
      });

      // Queda final e sumiço
      gsap.to(p, {
        y: '+=400',
        opacity: 0,
        duration: 1.2,
        delay: delay + duration - 0.8,
        ease: "power1.in",
        onComplete: () => p.remove()
      });
    }
  };

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);

    gsap.killTweensOf(`.${styles.flowerCore}`);
    gsap.killTweensOf(`.${styles.petalBack}`);
    gsap.to(`.${styles.skipBtn}`, { autoAlpha: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => {
        try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
        onComplete();
      }
    });

    // 1. Expansão Radial Inicial (Flor Desabrocha)
    tl.to(`.${styles.callToAction}`, { opacity: 0, y: 20, duration: 0.4, ease: "power2.in" }, 0)
      .to(`.${styles.petalBack}`, { scale: 1.4, rotation: '+=30', duration: 1.5, ease: "elastic.out(1, 0.5)", stagger: 0.05 }, 0.2)
      .to(`.${styles.petalMid}`,  { scale: 1.5, rotation: '+=45', duration: 1.8, ease: "elastic.out(1, 0.4)", stagger: 0.06 }, 0.3)
      .to(`.${styles.petalFront}`,{ scale: 1.4, rotation: '-=20', duration: 1.6, ease: "elastic.out(1, 0.6)", stagger: 0.08 }, 0.4)
      .to(`.${styles.centerGlow}`, { scale: 2.5, opacity: 0.6, duration: 1.2, ease: "power2.out" }, 0.6)

    // 2. Injeta Pétalas Físicas sopradas pelo vento
      .add(spawnWindPetals, 1.0)

    // 3. A flor inteira se desfaz no vento e sobe
      .to(`.${styles.flowerCore}`, { 
        x: 150, 
        y: -150, 
        rotation: 15, 
        scale: 0.8, 
        filter: "blur(4px)", 
        opacity: 0.3, 
        duration: 2, 
        ease: "power2.inOut" 
      }, 1.2)
      
    // 4. Revela o Texto central do convite
      .to(`.${styles.textCanvas}`, { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out" }, 1.8)
      .fromTo(`.${styles.names}`, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }, 2.0)
      .fromTo(`.${styles.dateLabel}`, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" }, 2.6)
      
    // 5. O fundo ganha vida e imagem
      .to(`.${styles.bgBloom}`, { opacity: 0, duration: 2 }, 2.0)
      .to(rootRef.current, { backgroundColor: "transparent", duration: 3, ease: "power2.inOut" }, 2.5)

    // 6. Transição final (Zoom In)
      .to(`.${styles.textCanvas}`, { scale: 1.2, opacity: 0, duration: 1.5, ease: "power2.in", delay: 3.5 });
  };

  const handleSkip = () => {
    try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
    onComplete();
  };

  // Helper para converter hex para rgba simples
  const hexToRGBA = (hex: string, opacity: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  const petalColors = {
    back: hexToRGBA(accentColor, 0.3),
    mid: hexToRGBA(accentColor, 0.6),
    front: accentColor,
  };

  return (
    <div className={styles.root} style={{ '--bg': bgPrimary } as React.CSSProperties} ref={rootRef}>
      
      {showSkip && !isOpening && (
        <button className={styles.skipBtn} onClick={handleSkip}>Pular 🌿</button>
      )}

      {/* Overlay de Transição Floral Inicial */}
      <div className={styles.bgBloom}></div>

      {/* Canvas da Ventania */}
      <div ref={windContainerRef} className={styles.windLayer}></div>

      {/* Textos do Convite (Revelados após sopro) */}
      <div className={styles.textCanvas}>
        <p className={styles.topIntro} style={{ fontFamily: fontSerif, color: textMain }}>CELEBRE A VIDA CONOSCO</p>
        <h1 className={styles.names} style={{ fontFamily: fontCursive, color: accentColor }}>{coupleNoiva} & {coupleNoivo}</h1>
        <div className={styles.divider} style={{ backgroundColor: accentColor }}></div>
        <p className={styles.dateLabel} style={{ fontFamily: fontSerif, color: textMain }}>{date?.toUpperCase()}</p>
      </div>

      {/* O BOTÃO FLOR CENTRAL */}
      <div className={styles.interactionZone} onClick={handleOpen}>
        <div className={styles.flowerCore}>
          
          <div className={styles.centerGlow} style={{ background: `radial-gradient(circle, ${accentColor}CC 0%, transparent 70%)` }}></div>

          <svg className={styles.flowerSVG} viewBox="0 0 400 400">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15"/>
              </filter>
              
              {/* Geometria da Pétala Natural */}
              <path id="petalShape" d="M200 200 C 230 130, 280 120, 200 80 C 120 120, 170 130, 200 200 Z" />
            </defs>

            {/* Camada Traseira (Back Petals) - 8 pétalas */}
            <g className={styles.petalGroupBack} fill={petalColors.back} filter="url(#shadow)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <use key={deg} href="#petalShape" className={styles.petalBack} style={{ transformOrigin: '200px 200px', transform: `rotate(${deg}deg) scale(1.1)` }} />
              ))}
            </g>

            {/* Camada Média (Mid Petals) - Rotacionadas 22.5 deg */}
            <g className={styles.petalGroupMid} fill={petalColors.mid}>
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (
                <use key={deg} href="#petalShape" className={styles.petalMid} style={{ transformOrigin: '200px 200px', transform: `rotate(${deg}deg) scale(0.9)` }} />
              ))}
            </g>

            {/* Camada Frontal (Front Petals) */}
            <g className={styles.petalGroupFront} fill={petalColors.front}>
               {[0, 60, 120, 180, 240, 300].map(deg => (
                 <use key={deg} href="#petalShape" className={styles.petalFront} style={{ transformOrigin: '200px 200px', transform: `rotate(${deg}deg) scale(0.7)` }} />
               ))}
            </g>

            {/* Miolo da Flor */}
            <circle cx="200" cy="200" r="14" fill="#FFF" filter="url(#shadow)" />
            <circle cx="200" cy="200" r="8" fill={accentColor} />
          </svg>
        </div>

        {!isOpening && (
          <div className={styles.callToAction} style={{ color: textMain }}>
            <span style={{ fontFamily: fontSerif }}>TOQUE PARA FLORESCER</span>
          </div>
        )}
      </div>
    </div>
  );
}
