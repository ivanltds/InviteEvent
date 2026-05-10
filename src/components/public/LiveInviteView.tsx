'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/(public)/page.module.css';
import Historia from '@/components/sections/Historia';
import OsNoivos from '@/components/sections/OsNoivos';
import Detalhes from '@/components/sections/Detalhes';
import FAQ from '@/components/sections/FAQ';
import RSVP from '@/components/sections/RSVP';
import AgendaSection from '@/components/sections/AgendaSection';
import Countdown from '@/components/sections/Countdown';
import HeroCarousel from '@/components/ui/HeroCarousel';
import EnvelopeGateway from '@/components/public/EnvelopeGateway/EnvelopeGateway';
import { Configuracao } from '@/lib/types/database';
import Link from 'next/link';

import { getContrastColor, getLegibleText } from '@/lib/utils/colors';

interface LiveInviteViewProps {
  config: Configuracao;
  couple: {
    noiva: string;
    noivo: string;
    data: string;
    rawDate: string;
  };
  visibility: {
    historia: boolean;
    noivos: boolean;
    faq: boolean;
    presentes: boolean;
  };
  agenda: any[];
  slug: string;
  previewBase64?: string | null;
  showGateway?: boolean;
  onGatewayComplete?: () => void;
  disableActions?: boolean; // For real-time dashboard preview disabling clicks
}

const LiveInviteView: React.FC<LiveInviteViewProps> = ({
  config,
  couple,
  visibility,
  agenda,
  slug,
  previewBase64,
  showGateway = false,
  onGatewayComplete,
  disableActions = false,
}) => {

  // Scoped Event CSS Variables e Seus Calculados para Segurança
  const bgPrimary = config.bg_primary || '#FAF9F6';
  const textMain = config.text_main || '#333333';
  const accentColor = config.accent_color || '#B2AC88';

  const eventThemeStyle = {
    '--bg-primary': bgPrimary,
    '--text-main': textMain,
    '--accent': accentColor,
    
    // VARIÁVEIS CRÍTICAS DE ACESSIBILIDADE FALTANTES NO PREVIEW:
    '--text-on-accent': getContrastColor(accentColor),
    '--text-main-safe': getLegibleText(bgPrimary, textMain),
    '--accent-safe': getLegibleText(bgPrimary, accentColor),

    '--font-cursive': config.font_cursive || "'Pinyon Script', cursive",
    '--font-serif': config.font_serif || "'Playfair Display', serif",
    '--viewport-height': disableActions ? '660px' : '100dvh', 
  } as React.CSSProperties;

  // Safe version of CTA handlers for when actions are disabled
  const ctaClick = (e: React.MouseEvent) => {
    if (disableActions) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <div 
      style={{ ...eventThemeStyle, position: 'relative', containerType: 'inline-size', width: '100%' }} 
      className={disableActions ? 'disable-interactions' : ''}
    >
      {/* CSS directly for disable-interactions mode inside parent context */}
      {disableActions && (
        <style jsx global>{`
          .disable-interactions a, 
          .disable-interactions button,
          .disable-interactions [role="button"] {
            pointer-events: none !important;
            cursor: default !important;
          }
        `}</style>
      )}

      <AnimatePresence>
        {showGateway && (
          <motion.div
            key="gateway"
            initial={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 1.2, ease: 'easeInOut' } }}
            style={{ 
              position: disableActions ? 'absolute' : 'fixed', 
              inset: 0, 
              zIndex: 999999 
            }}
          >
            <EnvelopeGateway
              slug={slug}
              bgPrimary={config.bg_primary || '#FAF9F6'}
              textMain={config.text_main || '#333333'}
              accentColor={config.accent_color || '#c8943a'}
              coupleNoiva={couple.noiva}
              coupleNoivo={couple.noivo}
              date={couple.data}
              rawDate={couple.rawDate}
              fontCursive={config.font_cursive}
              fontSerif={config.font_serif}
              heroImages={config.hero_images && config.hero_images.length > 0 ? config.hero_images : (previewBase64 ? [previewBase64] : undefined)}
              onComplete={() => {
                if (onGatewayComplete) onGatewayComplete();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className={styles.main}>
        <section className={styles.hero}>
          <HeroCarousel 
            imagesOverride={config.hero_images && config.hero_images.length > 0 ? config.hero_images : (previewBase64 ? [previewBase64] : undefined)} 
            videosOverride={config.hero_videos}
          />
          <h1 className="cursive">{couple.noiva} & {couple.noivo}</h1>
          <p className={styles.date}>{couple.data}</p>

          <Countdown targetDate={couple.rawDate} />

          <p className={styles.tagline}>O nosso grande dia está chegando!</p>
          <div className={styles.cta}>
            <a href={disableActions ? "#" : "#rsvp"} className={styles.primaryBtn} onClick={ctaClick}>Confirmar Presença</a>
            {visibility.presentes && (
              <Link href={disableActions ? "#" : `/presentes?invite=${slug}`} className={styles.secondaryBtn} onClick={ctaClick}>
                Lista de Presentes
              </Link>
            )}
            <Link href={disableActions ? "#" : `/mural?invite=${slug}`} className={styles.secondaryBtn} onClick={ctaClick}>
              Mural de Lembranças
            </Link>
          </div>
        </section>
      </main>

      {visibility.historia && <Historia config={config} />}
      {visibility.noivos && <OsNoivos config={config} />}
      <AgendaSection events={agenda} config={config} />
      
      {/* Evitar renderizar o RSVP formulário real se for disableActions para não conflitar requisições */}
      {!disableActions && slug !== 'preview' && <RSVP inviteSlug={slug} config={config} />}
      {disableActions && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.8 }}>
           <h2 style={{ fontFamily: 'var(--font-cursive)', fontSize: '3rem', color: 'var(--accent)' }}>RSVP</h2>
           <p style={{ color: 'var(--text-main)' }}>O formulário de confirmação aparecerá aqui para os convidados.</p>
        </div>
      )}

      {visibility.faq && <FAQ eventoId={config.evento_id} />}

      {slug === 'preview' && !disableActions && (
        <div className={styles.previewBar}>
          <div className={styles.previewText}>
            <h4>Uau, o que achou? ✨</h4>
            <p>Seu grande dia merece um convite assim. Salve-o agora!</p>
          </div>
          <Link href="/admin/login?mode=signup&claim_invite=true" className={styles.ctaButton}>
            Finalizar e Salvar
          </Link>
        </div>
      )}
    </div>
  );
};

export default LiveInviteView;
