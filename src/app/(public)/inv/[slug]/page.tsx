'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import styles from "../../page.module.css";
import Historia from "@/components/sections/Historia";
import OsNoivos from "@/components/sections/OsNoivos";
import Detalhes from "@/components/sections/Detalhes";
import FAQ from "@/components/sections/FAQ";
import RSVP from "@/components/sections/RSVP";
import AgendaSection from "@/components/sections/AgendaSection";
import Countdown from "@/components/sections/Countdown";
import { supabase } from '@/lib/supabase';
import { rsvpService } from '@/lib/services/rsvpService';
import { Configuracao } from '@/lib/types/database';
import Link from 'next/link';
import HeroCarousel from '@/components/ui/HeroCarousel';
// STORY-056: Envelope Gateway
import EnvelopeGateway from '@/components/public/EnvelopeGateway/EnvelopeGateway';

import LiveInviteView from '@/components/public/LiveInviteView';

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

  const [agenda, setAgenda] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // Verificar se deve mostrar o envelope (limite de 3 vezes)
        const searchParams = new URLSearchParams(window.location.search);
        const forcePreview = searchParams.get('preview') === 'true';
        const skipGatewayParam = searchParams.get('skip_gateway') === 'true';
        const skipGatewayStorage = typeof window !== 'undefined' && localStorage.getItem('skip_gateway') === 'true';
        
        const isExceeded = hasExceededViewLimit(slug, forcePreview);
        
        // 1. Buscar o convite pelo slug (movido para cima para checar RSVP status)
        const invite = await rsvpService.getInviteBySlug(slug);
        
        // Se já confirmou, pular gateway (STORY-060)
        let hasConfirmed = false;
        if (invite) {
          const rsvp = await rsvpService.getExistingRSVP(invite.id);
          if (rsvp && rsvp.status === 'confirmado') {
            hasConfirmed = true;
          }
        }

        setShowGateway(!isExceeded && !skipGatewayParam && !skipGatewayStorage && !hasConfirmed);

        // Intercept Preview Client-Side Funnel
        if (slug === 'preview') {
          let rawPayload = localStorage.getItem('pending_invite_state');
          if (!rawPayload) {
            rawPayload = sessionStorage.getItem('pending_invite_state');
          }
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
        if (!invite) {
          setLoading(false);
          return;
        }

        // 2. Buscar config baseada no evento_id do convite
        const [configRes, agendaRes] = await Promise.all([
          supabase
            .from('configuracoes')
            .select('*')
            .eq('evento_id', invite.evento_id)
            .maybeSingle(),
          supabase
            .from('eventos_agenda')
            .select('*')
            .eq('evento_id', invite.evento_id)
            .order('ordem', { ascending: true })
        ]);

        const configData = configRes.data;
        if (agendaRes.data) setAgenda(agendaRes.data);

        if (configData) {
          setConfig(configData);
          
          // FIX STORY-060: Evitar offset de 1 dia por conta de Timezone
          const [year, month, day] = configData.data_casamento.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          
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

  return (
    <LiveInviteView 
      config={config}
      couple={couple}
      visibility={visibility}
      agenda={agenda}
      slug={slug}
      previewBase64={previewBase64}
      showGateway={showGateway}
      onGatewayComplete={() => {
        incrementViewCount(slug);
        setShowGateway(false);
      }}
    />
  );
}
