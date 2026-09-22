'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";
import { supabase } from '@/lib/supabase';
import { rsvpService } from '@/lib/services/rsvpService';
import { Configuracao } from '@/lib/types/database';
import Link from 'next/link';
import { hasExceededViewLimit, incrementViewCount } from '@/lib/utils/envelopeViews';
import { findEventoSlugForSavedConvite, clearSavedConvite } from '@/lib/utils/linkUnico';

import LiveInviteView from '@/components/public/LiveInviteView';

interface InvitationPageClientProps {
  slug: string;
}

/**
 * Correção de 20/09/2026 (cartão de preview no WhatsApp): esta tela
 * continua inteiramente client-side (igual antes) — quem ganhou o
 * `generateMetadata` foi o `page.tsx` (Server Component) que a envolve,
 * passando `slug` como prop em vez de ler via `useParams()` aqui dentro.
 */
export default function InvitationPageClient({ slug }: InvitationPageClientProps) {
  const router = useRouter();
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
    detalhes: true,
    historia: true,
    noivos: true,
    faq: true,
    presentes: true
  });

  const [agenda, setAgenda] = useState<any[]>([]);
  // Modo Link Único: slug do EVENTO associado a este convite neste
  // dispositivo (achado via localStorage), usado em dois cenários
  // pedidos pelo usuário em 20/09/2026: (1) oferecer recomeçar quando o
  // convite salvo foi excluído, (2) permitir que outra pessoa no mesmo
  // dispositivo confirme a presença dela separadamente.
  const [linkUnicoEventoSlug, setLinkUnicoEventoSlug] = useState<string | null>(null);

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
          const payload = rawPayload ? JSON.parse(rawPayload) : null;
          const ANIMATION_TYPES = ['padrao', 'envelope_v3', 'cinematic', 'flower_wind', 'flower_wind_2'] as const;
          const randomAnimation = payload?.animacao_tipo || ANIMATION_TYPES[Math.floor(Math.random() * ANIMATION_TYPES.length)];

          const noiva = payload?.noiva_nome || 'Julieta';
          const noivo = payload?.noivo_nome || 'Romeu';
          const dataCasamento = payload?.data_evento || '2050-01-01';

          const mockConfig = {
            noiva_nome: noiva,
            noivo_nome: noivo,
            data_casamento: dataCasamento,
            bg_primary: payload?.bg_primary || '#FAF9F6',
            text_main: payload?.accent_color || '#333333',
            accent_color: payload?.accent_color || '#c8943a',
            font_cursive: payload?.font_cursive || "'Pinyon Script', cursive",
            font_serif: payload?.font_serif || "'Playfair Display', serif",
            animacao_tipo: randomAnimation,
            mostrar_historia: true,
            mostrar_noivos: true,
            mostrar_faq: false,
            mostrar_presentes: true,
            evento_id: 'preview',
            fotos: []
          };
          setConfig(mockConfig as unknown as Configuracao);
          setCouple({
            noiva,
            noivo,
            data: new Date(dataCasamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'}),
            rawDate: dataCasamento
          });
          setVisibility({
            detalhes: false, historia: true, noivos: false, faq: false, presentes: true
          });
          if (payload?.cover_image_url) {
             setPreviewBase64(payload.cover_image_url);
          }
          setLoading(false);
          return;
        }

        // 1. Buscar o convite pelo slug
        if (!invite) {
          // Correção de 20/09/2026: se este dispositivo tinha um convite
          // salvo (Link Único) apontando pra este slug e ele não existe
          // mais (ex.: excluído pelo admin), o convidado ficava preso
          // pra sempre num "Convite não encontrado" — o dispositivo
          // sempre redirecionava de volta pro mesmo slug morto. Zera o
          // vínculo salvo pra ele poder se cadastrar de novo.
          const eventoSlug = findEventoSlugForSavedConvite(slug);
          if (eventoSlug) {
            clearSavedConvite(eventoSlug);
            setLinkUnicoEventoSlug(eventoSlug);
          }
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
            detalhes: configData.mostrar_detalhes !== false,
            historia: configData.mostrar_historia !== false,
            noivos: configData.mostrar_noivos !== false,
            faq: configData.mostrar_faq !== false,
            presentes: configData.mostrar_presentes !== false
          });

          // Pedido do usuário: permitir que outra pessoa, no MESMO
          // dispositivo de quem já confirmou, consiga confirmar a
          // presença dela separadamente (o dispositivo só "lembra" um
          // convidado por evento no modo Link Único).
          if (configData.modo_convite === 'link_unico') {
            const eventoSlug = findEventoSlugForSavedConvite(slug);
            if (eventoSlug) setLinkUnicoEventoSlug(eventoSlug);
          }
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
        {linkUnicoEventoSlug ? (
          <>
            <p>Esse convite não está mais disponível, mas você pode se cadastrar de novo.</p>
            <Link href={`/inv/evento/${linkUnicoEventoSlug}`}>Cadastrar presença novamente</Link>
          </>
        ) : (
          <>
            <p>Por favor, verifique o link enviado pelos noivos.</p>
            <Link href="/">Voltar para a Home</Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {linkUnicoEventoSlug && (
        <div
          style={{
            background: '#faf8f4',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#555',
          }}
        >
          Esse link já está associado a uma confirmação neste dispositivo.{' '}
          <button
            type="button"
            onClick={() => {
              clearSavedConvite(linkUnicoEventoSlug);
              router.push(`/inv/evento/${linkUnicoEventoSlug}`);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#8a6d3b',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Não é você? Confirme sua presença separadamente
          </button>
        </div>
      )}
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
    </>
  );
}
