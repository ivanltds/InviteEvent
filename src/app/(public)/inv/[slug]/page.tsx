'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from "../../page.module.css";
import Historia from "@/components/sections/Historia";
import OsNoivos from "@/components/sections/OsNoivos";
import Detalhes from "@/components/sections/Detalhes";
import FAQ from "@/components/sections/FAQ";
import RSVP from "@/components/sections/RSVP";
import Countdown from "@/components/sections/Countdown";
import { supabase } from '@/lib/supabase';
import { rsvpService } from '@/lib/services/rsvpService';
import { Configuracao } from '@/lib/types/database';
import Link from 'next/link';
import HeroCarousel from '@/components/ui/HeroCarousel';
// STORY-056: Envelope Gateway
import EnvelopeGateway from '@/components/public/EnvelopeGateway/EnvelopeGateway';

const STORAGE_KEY_PREFIX = 'envelope_views_';

/**
 * Verifica se o envelope já foi visualizado 3 vezes ou mais neste dispositivo.
 * Retorna true se deve pular a animação.
 */
function hasExceededViewLimit(slug: string, forcePreview: boolean): boolean {
  if (forcePreview || slug === 'preview') return false; // ?preview=true ou slug 'preview' força re-exibição
  try {
    const views = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`) || '0', 10);
    return views >= 3;
  } catch {
    return false;
  }
}

function incrementViewCount(slug: string) {
  try {
    const views = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`) || '0', 10);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, (views + 1).toString());
  } catch {
    // Ignora se estiver no modo anônimo, por exemplo
  }
}

export default function InvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  // STORY-056: controla visibilidade do gateway
  const [showGateway, setShowGateway] = useState(false);

  const [couple, setCouple] = useState({
    noiva: 'Layslla',
    noivo: 'Marcus',
    data: '13 de Junho de 2026',
    rawDate: '2026-06-13'
  });

  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const [visibility, setVisibility] = useState({
    historia: true,
    noivos: true,
    faq: true,
    presentes: true
  });

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // Verificar se deve mostrar o envelope (limite de 3 vezes)
        const searchParams = new URLSearchParams(window.location.search);
        const forcePreview = searchParams.get('preview') === 'true';
        const isExceeded = hasExceededViewLimit(slug, forcePreview);
        setShowGateway(!isExceeded);

        // Intercept Preview Client-Side Funnel
        if (slug === 'preview') {
          const rawPayload = localStorage.getItem('pending_invite_state');
          if (rawPayload) {
            const payload = JSON.parse(rawPayload);
            const mockConfig = {
              noiva_nome: payload.noiva_nome,
              noivo_nome: payload.noivo_nome,
              data_casamento: payload.data_evento || '2050-01-01',
              bg_primary: payload.bg_primary, // Agora é o fundo claro
              text_main: payload.accent_color, // Fonte agora é a cor forte (marcante)
              accent_color: payload.accent_color, // Destaques agora são a cor forte
              font_cursive: payload.font_cursive || "'Pinyon Script', cursive",
              font_serif: payload.font_serif || "'Playfair Display', serif",
              mostrar_historia: true,
              mostrar_noivos: true,
              mostrar_faq: false,
              mostrar_presentes: true,
              evento_id: 'preview',
              fotos: []
            };
            setConfig(mockConfig as any);
            setCouple({
              noiva: payload.noiva_nome,
              noivo: payload.noivo_nome,
              data: new Date(payload.data_evento || '2050-01-01').toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'}),
              rawDate: payload.data_evento || '2050-01-01'
            });
            setVisibility({
              historia: true, noivos: false, faq: false, presentes: true
            });
            if (payload.cover_image_url) {
               setPreviewBase64(payload.cover_image_url);
            }
            setLoading(false);
            return;
          }
        }

        // 1. Buscar o convite pelo slug
        const invite = await rsvpService.getInviteBySlug(slug);
        if (!invite) {
          setLoading(false);
          return;
        }

        // 2. Buscar config baseada no evento_id do convite
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('evento_id', invite.evento_id)
          .maybeSingle();

        if (configData) {
          setConfig(configData);

          // Injetar CSS tokens do evento no convite público APENAS (scoped)
          // STORY-058: event theme tokens ficam em .eventTheme, não no :root global
          const date = new Date(configData.data_casamento);
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });

          setCouple({
            noiva: configData.noiva_nome,
            noivo: configData.noivo_nome,
            data: formattedDate,
            rawDate: configData.data_casamento
          });

          setVisibility({
            historia: configData.mostrar_historia !== false,
            noivos: configData.mostrar_noivos !== false,
            faq: configData.mostrar_faq !== false,
            presentes: configData.mostrar_presentes !== false
          });
        }
      } catch (e) {
        console.error('Erro ao inicializar convite:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug]);

  if (loading) return <div className={styles.loading}>Acolhendo seu convite...</div>;

  if (!config) {
    return (
      <div className={styles.errorContainer}>
        <h1>Convite não encontrado</h1>
        <p>Por favor, verifique o link enviado pelos noivos.</p>
        <Link href="/">Voltar para a Home</Link>
      </div>
    );
  }

  // STORY-056: Mostrar gateway antes do convite
  if (showGateway) {
    return (
      <EnvelopeGateway
        slug={slug}
        bgPrimary={config.bg_primary || '#FAF9F6'}
        textMain={config.text_main || '#333333'}
        accentColor={config.accent_color || '#c8943a'}
        coupleNoiva={couple.noiva}
        coupleNoivo={couple.noivo}
        date={couple.data}
        fontCursive={config.font_cursive}
        fontSerif={config.font_serif}
        onComplete={() => {
          incrementViewCount(slug);
          setShowGateway(false);
        }}
      />
    );
  }

  // STORY-058: event theme scoped — aplicado APENAS ao convite, não ao admin
  const eventThemeStyle = {
    '--bg-primary': config.bg_primary || '#FAF9F6',
    '--text-main': config.text_main || '#333333',
    '--accent': config.accent_color || '#B2AC88',
    '--font-cursive': config.font_cursive || "'Pinyon Script', cursive",
    '--font-serif': config.font_serif || "'Playfair Display', serif",
  } as React.CSSProperties;

  return (
    // STORY-058: .eventTheme wrapper — cores do evento ficam scoped aqui,
    // nunca vazam para o admin chrome ou para o :root global
    <div style={eventThemeStyle}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <HeroCarousel imagesOverride={previewBase64 ? [previewBase64] : undefined} />
          <h1 className="cursive">{couple.noiva} & {couple.noivo}</h1>
          <p className={styles.date}>{couple.data}</p>

          <Countdown targetDate={couple.rawDate} />

          <p className={styles.tagline}>O nosso grande dia está chegando!</p>
          <div className={styles.cta}>
            <a href="#rsvp" className={styles.primaryBtn}>Confirmar Presença</a>
            {visibility.presentes && (
              <Link href={`/presentes?invite=${slug}`} className={styles.secondaryBtn}>Lista de Presentes</Link>
            )}
          </div>
        </section>
      </main>

      {visibility.historia && <Historia config={config} />}
      {visibility.noivos && <OsNoivos config={config} />}
      <Detalhes config={config} />
      {slug !== 'preview' && <RSVP inviteSlug={slug} />}
      {visibility.faq && <FAQ eventoId={config.evento_id} />}

      {slug === 'preview' && (
        <div className={styles.previewBar}>
          <div className={styles.previewText}>
            <h4>Uau, o que achou? ✨</h4>
            <p>Seu grande dia merece um convite assim. Salve-o agora!</p>
          </div>
          <Link href="/admin/login?claim_invite=true" className={styles.ctaButton}>
            Finalizar e Salvar
          </Link>
        </div>
      )}
    </div>
  );
}
