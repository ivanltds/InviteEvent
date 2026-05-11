'use client';

import React, { useRef } from 'react';
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
import { Configuracao } from '@/lib/types/database';
import Link from 'next/link';
import { useTrackSection } from '@/hooks/useTrackSection';

// STORY-056 & PRD-010: Sistema Multi-Animação de Entrada
import EnvelopeGateway from '@/components/public/EnvelopeGateway/EnvelopeGateway';
import GSAPEnvelopeV3 from '@/components/public/EnvelopeGateway/GSAPEnvelopeV3';
import GSAPCinematic from '@/components/public/EnvelopeGateway/GSAPCinematic';
import GSAPFlowerWind from '@/components/public/EnvelopeGateway/GSAPFlowerWind';

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
  isPreviewMode?: boolean; // Special preview simulation mode for organizers
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
  isPreviewMode = false,
}) => {

  // Telemetria: Refs de Rastreamento de Tempo de Visualização por Seção
  const refHero = useRef<HTMLElement>(null);
  const refHistoria = useRef<HTMLElement>(null);
  const refNoivos = useRef<HTMLElement>(null);
  const refAgenda = useRef<HTMLElement>(null);
  const refRSVP = useRef<HTMLElement>(null);
  const refFAQ = useRef<HTMLElement>(null);

  // Sensores de Visibilidade (PRD-008 Sprint 3)
  const trackOptions = { eventoId: config.evento_id };
  useTrackSection(refHero, { ...trackOptions, sectionName: 'invite_hero' });
  useTrackSection(refHistoria, { ...trackOptions, sectionName: 'invite_historia' });
  useTrackSection(refNoivos, { ...trackOptions, sectionName: 'invite_noivos' });
  useTrackSection(refAgenda, { ...trackOptions, sectionName: 'invite_agenda' });
  useTrackSection(refRSVP, { ...trackOptions, sectionName: 'invite_rsvp' });
  useTrackSection(refFAQ, { ...trackOptions, sectionName: 'invite_faq' });

  // Scoped Event CSS Variables e Seus Calculados para Segurança
  const bgPrimary = config.bg_primary || '#FAF9F6';
  const textMain = config.text_main || '#333333';
  const accentColor = config.accent_color || '#B2AC88';

  // Utilitário local para forçar carregamento das fontes caso o DynamicStyles global falhe no preview
  const getFontFamilyName = (fontStr: string) => {
    const match = fontStr?.match(/'([^']+)'/);
    return match ? match[1].replace(/\s+/g, '+') : null;
  };

  const cursiveName = getFontFamilyName(config.font_cursive || "'Pinyon Script', cursive");
  const serifName = getFontFamilyName(config.font_serif || "'Playfair Display', serif");
  
  const googleFontsUrl = (cursiveName && serifName) 
    ? `https://fonts.googleapis.com/css2?family=${cursiveName}&family=${serifName}&display=swap`
    : null;

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
      {/* Força download das fontes dinâmicas se necessário no sandbox */}
      {googleFontsUrl && (
        <style dangerouslySetInnerHTML={{ __html: `@import url('${googleFontsUrl}');` }} />
      )}

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

      {/* Botão Voltar para Admin se estiver em Modo Preview */}
      {isPreviewMode && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 100000,
          pointerEvents: 'auto'
        }}>
          <Link 
            href="/admin/configuracoes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #E2E8F0',
              borderRadius: '50px',
              color: '#1E293B',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Voltar às Configurações
          </Link>
        </div>
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
            {(() => {
              const SelectedGateway = (() => {
                switch(config.animacao_tipo) {
                  case 'envelope_v3': return GSAPEnvelopeV3;
                  case 'cinematic': return GSAPCinematic;
                  case 'flower_wind': return GSAPFlowerWind;
                  case 'padrao':
                  default: return EnvelopeGateway;
                }
              })();

              return (
                <SelectedGateway
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
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <main className={styles.main}>
        <section ref={refHero} className={styles.hero}>
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
              <Link 
                href={disableActions ? "#" : `/presentes?invite=${slug}${isPreviewMode ? `&preview=true&eventId=${config.evento_id}` : ''}`} 
                className={styles.secondaryBtn} 
                onClick={ctaClick}
              >
                Lista de Presentes
              </Link>
            )}
            <Link 
              href={disableActions ? "#" : `/mural?invite=${slug}${isPreviewMode ? `&preview=true&eventId=${config.evento_id}` : ''}`} 
              className={styles.secondaryBtn} 
              onClick={ctaClick}
            >
              Mural de Lembranças
            </Link>
          </div>
        </section>
      </main>

      {visibility.historia && <section ref={refHistoria}><Historia config={config} /></section>}
      {visibility.noivos && <section ref={refNoivos}><OsNoivos config={config} /></section>}
      <section ref={refAgenda}><AgendaSection events={agenda} config={config} /></section>
      
      <section ref={refRSVP}>
        {/* Evitar renderizar o RSVP formulário real se for disableActions para não conflitar requisições */}
        {/* Renderiza formulário interativo se não estiver com ações bloqueadas OU estiver no modo Simulação */}
        {!disableActions && (slug !== 'preview' || isPreviewMode) ? (
          <RSVP inviteSlug={slug} config={config} isPreviewMode={isPreviewMode} />
        ) : (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.8 }}>
            <h2 style={{ fontFamily: 'var(--font-cursive)', fontSize: '3rem', color: 'var(--accent)' }}>RSVP</h2>
            <p style={{ color: 'var(--text-main)' }}>O formulário de confirmação aparecerá aqui para os convidados.</p>
          </div>
        )}
      </section>

      {visibility.faq && <section ref={refFAQ}><FAQ eventoId={config.evento_id} /></section>}

      {(slug === 'preview' || isPreviewMode) && !disableActions && (
        <div className={styles.previewBar}>
          <div className={styles.previewText}>
            <h4>{isPreviewMode ? 'Modo Simulação ⚡' : 'Uau, o que achou? ✨'}</h4>
            <p>{isPreviewMode ? 'Interaja à vontade, nada será salvo no banco real.' : 'Seu grande dia merece um convite assim. Salve-o agora!'}</p>
          </div>
          <Link 
            href={isPreviewMode ? "/admin/configuracoes" : "/admin/login?mode=signup&claim_invite=true"} 
            className={styles.ctaButton}
          >
            {isPreviewMode ? 'Voltar às Configurações' : 'Finalizar e Salvar'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default LiveInviteView;
