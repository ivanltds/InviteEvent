'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import styles from './GSAPFlowerWind.module.css';
import { GatewayProps } from './GatewayTypes';

const STORAGE_KEY_PREFIX = 'envelope_opened_';

// Definições idênticas ao wireframe
const COUNTS = [8, 8, 8];
const LAYERS = ['layerOuter', 'layerMid', 'layerInner'];
const Z_OFF = [8, 5, 2];
const A_OFF = [0, 22.5, 45];
const LEAF_COLORS = ['#A8C5A0', '#8FB387', '#7AA070', '#C5D8C0', '#90B88A'];

export default function GSAPFlowerWind({
  slug,
  bgPrimary = '#FDFAF6',
  textMain = '#3A2E28',
  accentColor = '#C9A84C', // The "gold" equivalent
  coupleNoiva = 'Noiva',
  coupleNoivo = 'Noivo',
  date = '',
  fontCursive = "'Great Vibes', cursive",
  fontSerif = "'Cinzel', serif",
  onComplete
}: GatewayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leavesContainerRef = useRef<HTMLDivElement>(null);
  const pollenContainerRef = useRef<HTMLDivElement>(null);
  
  const [isActive, setIsActive] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  // Helper para gerar variações suaves da cor de sotaque (Para as pétalas)
  // O wireframe usava tons fixos. Nós derivamos das cores.
  // Vamos usar um fallback leve se accentColor for dourado/escuro, mas pra manter simples, podemos usar mix com branco.
  // Criando variações hex para os fills e backs das camadas:
  const PETAL_FILLS = [
    `${accentColor}33`, // Outer (mais transparente/claro)
    `${accentColor}66`, // Mid
    `${accentColor}99`  // Inner
  ];
  const PETAL_BACKS = [
    `${accentColor}44`,
    `${accentColor}77`,
    `${accentColor}AA`
  ];

  // Gera o state de pétalas inicial
  const petalsData = useMemo(() => {
    const data: any[] = [];
    LAYERS.forEach((lid, li) => {
      const count = COUNTS[li];
      const fill = PETAL_FILLS[li];
      const back = PETAL_BACKS[li];
      for (let i = 0; i < count; i++) {
        const angle = A_OFF[li] + (360 / count) * i;
        data.push({
          id: `${lid}_p${i}`,
          layerId: lid,
          layerIndex: li,
          angle,
          zOff: Z_OFF[li],
          zIndex: 10 - li,
          fill,
          back
        });
      }
    });
    return data;
  }, [accentColor]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const floatAnim = gsap.to(wrapperRef.current, {
      y: 12, 
      duration: 3, 
      ease: "sine.inOut", 
      yoyo: true, 
      repeat: -1
    });

    const xTo = gsap.quickTo(wrapperRef.current, "rotationY", {duration: 1, ease: "power3.out"});
    const yTo = gsap.quickTo(wrapperRef.current, "rotationX", {duration: 1, ease: "power3.out"});

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive) return;
      xTo(-(window.innerWidth / 2 - e.pageX) / 35);
      yTo((window.innerHeight / 2 - e.pageY) / 35);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      floatAnim.kill();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isActive]);

  const launchFallingLeaves = (count: number, delay: number) => {
    if (!leavesContainerRef.current) return;
    const container = leavesContainerRef.current;
    
    for (let i = 0; i < count; i++) {
      const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      const w = 24 + Math.random() * 24;
      const h = w * 1.75;
      
      const leaf = document.createElement('div');
      leaf.className = styles.fallingLeaf;
      leaf.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 40 70" xmlns="http://www.w3.org/2000/svg">
        <path d="M 20 70 C 0 50, -8 30, 5 10 C 12 0, 28 0, 35 10 C 48 30, 40 50, 20 70 Z" fill="${color}" opacity="0.88"/>
        <line x1="20" y1="65" x2="20" y2="12" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      </svg>`;
      leaf.style.left = (5 + Math.random() * 90) + 'vw';
      leaf.style.top = '-80px';
      container.appendChild(leaf);

      const startDelay = delay + Math.random() * 2.5;
      const dur = 4 + Math.random() * 5;
      const driftX = (Math.random() - 0.5) * 600;
      const swayAmp = 80 + Math.random() * 120;
      const rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 300);

      gsap.to(leaf, { opacity: 0.85, duration: 0.4, delay: startDelay });

      gsap.to(leaf, {
        y: window.innerHeight + 120,
        x: driftX,
        rotation: rotSpeed,
        duration: dur,
        ease: "none",
        delay: startDelay,
        onComplete: () => leaf.remove()
      });

      gsap.to(leaf, {
        x: '+=' + swayAmp,
        duration: 1.4 + Math.random() * 0.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: Math.ceil(dur / 1.5),
        delay: startDelay
      });

      gsap.to(leaf, {
        opacity: 0,
        duration: 1.5,
        delay: startDelay + dur - 1.5
      });
    }
  };

  const handleOpen = () => {
    if (!isActive || !wrapperRef.current) return;
    setIsActive(false);

    gsap.killTweensOf(wrapperRef.current);
    gsap.to(wrapperRef.current, { rotationX: 0, rotationY: 0, y: 0, duration: 0.6, ease: "power2.out" });
    gsap.to(`.${styles.hint}`, { autoAlpha: 0, duration: 0.3 });
    gsap.to(`.${styles.skipBtn}`, { autoAlpha: 0, duration: 0.3 });

    const tl = gsap.timeline({
      onComplete: () => {
        try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
        onComplete();
      }
    });

    /* 1. RESPIRAÇÃO */
    tl.to(wrapperRef.current, { scale: 1.06, duration: 0.3, ease: "power1.out" }, 0)
      .to(wrapperRef.current, { scale: 1, duration: 0.3, ease: "power1.in" }, 0.3);

    /* 2. DESABROCHAR FLUIDO */
    LAYERS.forEach((lid, li) => {
      const count = COUNTS[li];
      const startT = 0.3 + li * 0.15;

      for (let i = 0; i < count; i++) {
        const elId = `#${lid}_p${i}`;
        tl.to(elId, {
          rotateX: -160,
          skewY: (i % 2 === 0 ? 6 : -6),
          duration: 1.3,
          ease: "power2.inOut",
        }, startT + i * 0.04)
        .set(elId, { zIndex: 1 }, startT + i * 0.04 + 0.65)
        .to(elId, {
          skewY: 0,
          rotateX: -165,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)"
        }, startT + i * 0.04 + 1.3);
      }
    });

    /* 3. PÓLEN */
    if (pollenContainerRef.current) {
      for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = styles.pollenDot;
        const size = 2 + Math.random() * 5;
        p.style.cssText = `width:${size}px;height:${size}px;margin-left:${-size/2}px;margin-top:${-size/2}px;`;
        pollenContainerRef.current.appendChild(p);
        
        const tx = (Math.random() - 0.5) * 500;
        const ty = (Math.random() - 0.5) * 500 - 80;
        const dur = 2 + Math.random();
        const del = 0.5 + Math.random() * 0.5;
        
        tl.to(p, { x: tx, y: ty, scale: Math.random() * 2 + 0.5, opacity: Math.random() * 0.8 + 0.2, duration: dur, ease: "power2.out" }, del)
          .to(p, { opacity: 0, duration: 0.8 }, del + dur - 0.8);
      }
    }

    /* 4. CARTÃO EXPANDE */
    tl.to(`.${styles.card}`, {
      inset: 0, borderRadius: "8px",
      y: -20, z: 40,
      duration: 1.2, ease: "expo.inOut",
      boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
    }, 1.8)
    .to(`.${styles.cardBorder}`, { borderRadius: "6px", duration: 1.2, ease: "expo.inOut" }, 1.8)
    .set(`.${styles.card}`, { zIndex: 20 }, 1.9)

    /* 5. CARTÃO TOMA A FRENTE */
    .to(`.${styles.card}`, {
      y: 0, z: 100, scale: 1.08,
      duration: 1.2, ease: "power3.out",
      boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
    }, 3.0)
    .to(`.${styles.layerOuter}, .${styles.layerMid}, .${styles.layerInner}`, {
      z: -200, opacity: 0.2, duration: 1.2, ease: "power3.out"
    }, 3.0)

    /* 6. VENTO: Pétalas são SOPRADAS para longe */
    .add(() => {
      petalsData.forEach((petal, idx) => {
        const elId = `#${petal.id}`;
        const tx = (Math.random() - 0.45) * 1400;
        const ty = -300 - Math.random() * 600;
        const tz = -200 - Math.random() * 300;
        const rot = (Math.random() - 0.5) * 720;
        const rotX = -90 + (Math.random() - 0.5) * 180;
        const delay = Math.random() * 0.5;

        gsap.to(elId, {
          x: tx, y: ty, z: tz,
          rotation: rot, rotateX: rotX,
          scale: 0.2 + Math.random() * 0.6,
          opacity: 0,
          duration: 2.2 + Math.random() * 1.2,
          ease: "power1.inOut",
          delay
        });
      });
    }, 4.0)

    /* 7. FOLHAS CAEM */
    .add(() => {
      launchFallingLeaves(22, 0);
    }, 4.0)

    /* 9. MERGULHO FINAL REVELANDO O FUNDO REAL */
    .to(`.${styles.card}`, { scale: 5, autoAlpha: 0, duration: 1.8, ease: "power3.inOut" }, 7.0)
    .to(rootRef.current, { backgroundColor: "transparent", duration: 2, ease: "power2.inOut" }, 7.0)
    .set(wrapperRef.current, { display: "none" });
  };

  const handleSkip = () => {
    try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true'); } catch (_) {}
    onComplete();
  };

  const containerVars = {
    '--gold': accentColor,
    '--gold-light': `${accentColor}88`,
    '--card-bg': bgPrimary,
    '--ink': textMain,
    '--ink-light': textMain,
    '--font-cursive': fontCursive,
    '--font-serif': fontSerif,
  } as React.CSSProperties;

  return (
    <div className={styles.root} style={containerVars} ref={rootRef}>
      {showSkip && isActive && (
        <button className={styles.skipBtn} onClick={handleSkip}>Pular 🌿</button>
      )}

      <div className={styles.scene}>
        <div className={styles.flowerWrapper} ref={wrapperRef} onClick={handleOpen}>
          
          <div className={styles.card}>
            <div className={styles.cardBorder}></div>
            <div className={styles.cardContent}>
              <div className={styles.cardTopText}>CELEBRE CONOSCO</div>
              <h2>{coupleNoiva} &<br/>{coupleNoivo}</h2>
              <div className={styles.cardDivider}></div>
              <div className={styles.cardDate}>{date}</div>
            </div>
          </div>

          <div className={styles.layerOuter}>
            {petalsData.filter(p => p.layerId === 'layerOuter').map(petal => (
              <div key={petal.id} id={petal.id} className={styles.petal} style={{ transform: `translateX(-50%) rotate(${petal.angle}deg) translateZ(${petal.zOff}px)`, zIndex: petal.zIndex }}>
                <div className={`${styles.petalFace} ${styles.front}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.fill} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
                  </svg>
                </div>
                <div className={`${styles.petalFace} ${styles.back}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.back}/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.layerMid}>
            {petalsData.filter(p => p.layerId === 'layerMid').map(petal => (
              <div key={petal.id} id={petal.id} className={styles.petal} style={{ transform: `translateX(-50%) rotate(${petal.angle}deg) translateZ(${petal.zOff}px)`, zIndex: petal.zIndex }}>
                <div className={`${styles.petalFace} ${styles.front}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.fill} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
                  </svg>
                </div>
                <div className={`${styles.petalFace} ${styles.back}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.back}/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.layerInner}>
            {petalsData.filter(p => p.layerId === 'layerInner').map(petal => (
              <div key={petal.id} id={petal.id} className={styles.petal} style={{ transform: `translateX(-50%) rotate(${petal.angle}deg) translateZ(${petal.zOff}px)`, zIndex: petal.zIndex }}>
                <div className={`${styles.petalFace} ${styles.front}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.fill} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
                  </svg>
                </div>
                <div className={`${styles.petalFace} ${styles.back}`}>
                  <svg viewBox="0 0 230 230" xmlns="http://www.w3.org/2000/svg" className={styles.petalSvg}>
                    <path d="M 115 230 C 55 190,15 140,20 90 C 25 40,80 10,115 5 C 150 10,205 40,210 90 C 215 140,175 190,115 230 Z" fill={petal.back}/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div ref={pollenContainerRef} className={styles.pollenContainer}></div>
          <div className={styles.hint}>TOQUE PARA DESABROCHAR</div>
        </div>
      </div>

      <div ref={leavesContainerRef} className={styles.leavesContainer}></div>
    </div>
  );
}
