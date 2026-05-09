'use client';

import { useEffect, useState } from 'react';
import styles from "./Landing.module.css";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [videoIndex, setVideoIndex] = useState(0);

  const videos = [
    "/videos/13347145_2160_3840_30fps.mp4",
    "/videos/14752780_2160_3840_30fps.mp4",
    "/videos/8502799-uhd_2160_3840_24fps.mp4",
  ];

  useEffect(() => {
    // Efeito de cross-fade de vídeo real
    const interval = setInterval(() => {
      setVideoIndex(prev => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [videos.length]);

  return (
    <div className={styles.landingWrapper}>
      <nav className={styles.glassNav}>
        <div className={styles.logo}>InviteEvent</div>
        <div className={styles.navLinks}>
          <a href="#experiencia">Experiência</a>
          <a href="#funcionalidades">Inteligência</a>
          <a href="#galeria">Design</a>
        </div>
        <Link href="/criar" className={styles.btnPrimary} style={{ padding: '12px 24px', fontSize: '12px' }}>
          Criar Convite
        </Link>
      </nav>

      {/* Hero Section with Video Cross-Fade */}
      <header className={styles.hero}>
        <div className={styles.videoContainer}>
          {videos.map((src, index) => (
            <video
              key={src}
              src={src}
              autoPlay
              muted
              loop
              playsInline
              className={`${styles.videoBg} ${videoIndex === index ? styles.videoBgActive : ''}`}
            />
          ))}
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>O Convite do Seu Casamento,<br/>Elevado ao Nível de <span className={styles.gold}>Obra de Arte</span>.</h1>
          <p className={styles.heroSubtitle}>Surpreenda seus convidados com uma experiência cinematográfica incomparável. Escolha designs de alta-costura, conte sua história com transições fluidas e gerencie confirmações de presença de forma 100% automatizada e segura.</p>
          <Link href="/criar" className={styles.btnPrimary}>Começar Jornada Mágica</Link>
        </div>
      </header>

      {/* Section 1: Split Layout */}
      <section id="experiencia" className={styles.section}>
        <div className={`${styles.container} ${styles.splitLayout}`}>
          <div className={styles.splitText}>
            <h2 className={styles.gold}>Incomparável desde o primeiro toque.</h2>
            <h2>Mais que um convite,<br/>uma declaração de amor.</h2>
            <p>Diga adeus aos PDFs estáticos e links sem graça. O InviteEvent entrega um envelope digital de luxo animado em 3D, projetado para emular a elegância de um convite impresso com a fluidez do digital.</p>
            <p>Cada detalhe — do selo dourado de cera às transições em slow-motion das fotos do casal — foi desenvolvido para criar uma contagem regressiva emocionante até o grande dia.</p>
            <Link href="/inv/preview">Ver Demonstração do Envelope</Link>
          </div>
          <div className={styles.imageWrapper}>
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800" alt="Casal elegante" />
          </div>
        </div>
      </section>

      {/* Section 2: Bento Grid */}
      <section id="funcionalidades" className={`${styles.section} ${styles.featuresSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.gold}>Tecnologia Invisível</h2>
            <h2>Inteligência e Elegância</h2>
            <p>Por trás do design luxuoso, um sistema poderoso trabalha silenciosamente para que você foque apenas em aproveitar o momento.</p>
          </div>
          
          <div className={styles.bentoGrid}>
            <div className={`${styles.bentoCard} ${styles.span2}`}>
              <div className={styles.bentoIcon}>✧</div>
              <h3>Lista de Presentes com Resgate em Pix</h3>
              <p>Crie uma lista elegante de presentes virtuais e cotas de lua de mel. Resgate o valor diretamente via PIX para sua conta corrente bancária com taxas extremamente reduzidas e total transparência.</p>
            </div>
            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon}>♡</div>
              <h3>RSVP Inteligente e Nominal</h3>
              <p>Permita que seus convidados confirem presença por indivíduo de forma rápida e segura. Acompanhe os números reais e alertas de acompanhantes em tempo real diretamente no seu painel administrativo.</p>
            </div>
            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon}>📷</div>
              <h3>Mural Interativo de Memórias</h3>
              <p>Um espaço colaborativo de afeto. Seus convidados sobem fotos tiradas no grande dia e deixam mensagens carinhosas que aparecem em tempo real no painel do casamento, com moderação total de privacidade.</p>
            </div>
            <div 
              className={`${styles.bentoCard} ${styles.span2}`} 
              style={{ background: "url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800') center/cover", color: "white", position: "relative" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))", borderRadius: "32px" }}></div>
              <div style={{ position: "relative", zIndex: 1, marginTop: "auto" }}>
                <h3 style={{ color: "#FFF" }}>Identidade Visual Exclusiva</h3>
                <p style={{ color: "#EAEAEA" }}>Estilos refinados inspirados em editoriais de moda. Selecione paletas de cores sofisticadas, tipografias cursivas pré-renderizadas e layouts que refletem com perfeição a essência do seu amor.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Mural Vivo Preview */}
      <section id="mural-preview" className={`${styles.section} ${styles.muralSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.gold}>Mural Vivo de Memórias</h2>
            <h2>O afeto compartilhado em tempo real</h2>
            <p>Seus convidados podem enviar fotos e mensagens carinhosas que aparecem magicamente no mural do evento. Experimente a dinâmica em tempo real abaixo:</p>
          </div>
          
          <div className={styles.muralPreviewGrid}>
            <div className={styles.previewCard}>
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600" style={{ width: '100%', display: 'block', height: '300px', objectFit: 'cover' }} alt="Alianças" />
            </div>
            <div className={styles.previewCard} style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5EFEB 100%)", padding: "30px", borderLeft: "4px solid #C5A059", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "200px" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontStyle: "italic", margin: "0 0 12px 0", color: "#1A1A1A" }}>
                "Ver o brilho no olhar de vocês hoje é ter a certeza de que o amor verdadeiro é real e inabalável!"
              </p>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C5A059" }}>— Tio Roberto</span>
            </div>
            <div className={styles.previewCard}>
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" style={{ width: '100%', display: 'block', height: '300px', objectFit: 'cover' }} alt="Noivos" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "20px", color: "#FFF" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 4px 0" }}>"Os mais lindos! Que alegria imensa viver esse dia com vocês!"</p>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.8)" }}>— Camila & Bruno</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Parallax Photo Band */}
      <section id="galeria" className={styles.photoBand}>
        <div className={styles.photoBandContent}>
          <h2>"O detalhe não é apenas um detalhe.<br/>Ele faz o design."</h2>
          <p style={{ color: "#EAEAEA", marginTop: "15px", fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase" }}>— Experiência Majestic</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.container}>
          <h2 className={styles.gold}>Pronto para inspirar?</h2>
          <h2>O seu grande dia merece<br/>um começo inesquecível.</h2>
          <div style={{ marginTop: "50px" }}>
            <Link href="/criar" className={styles.btnPrimary} style={{ padding: "20px 60px", fontSize: "16px" }}>
              Criar Convite Agora
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
