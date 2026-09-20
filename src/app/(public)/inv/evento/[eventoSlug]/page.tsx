'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';
import { Configuracao } from '@/lib/types/database';
import { getSavedConvite } from '@/lib/utils/linkUnico';
import LiveInviteView from '@/components/public/LiveInviteView';
import styles from '../../../page.module.css';

/**
 * Ponto de entrada do modo Link Único. Correção de 20/09/2026: antes esta
 * página mostrava SÓ a tela de auto-identificação, bloqueando o convite —
 * feedback do usuário foi que isso deveria abrir o convite primeiro, e só
 * pedir "quem é você" no momento de confirmar presença. Agora esta página
 * renderiza a MESMA experiência completa de /inv/[slug] (hero, história,
 * agenda etc.), e é o próprio <RSVP> (via prop `autoCadastro`) que pede a
 * identificação, junto da confirmação.
 *
 * Com convite já salvo no navegador (visita de retorno), redireciona
 * direto para a rota de sempre — sem passar por aqui de novo.
 */
export default function PublicAutoCadastroPage() {
  const params = useParams();
  const router = useRouter();
  const eventoSlug = params.eventoSlug as string;

  const [config, setConfig] = useState<Configuracao | null>(null);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [couple, setCouple] = useState({ noiva: '', noivo: '', data: '', rawDate: '' });
  const [agenda, setAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modoInvalido, setModoInvalido] = useState(false);

  useEffect(() => {
    async function init() {
      const evento = await eventService.getEventoBySlug(eventoSlug);
      if (!evento) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const saved = getSavedConvite(eventoSlug);
      if (saved) {
        router.replace(`/inv/${saved.slug}`);
        return;
      }

      const [configRes, agendaRes] = await Promise.all([
        supabase.from('configuracoes').select('*').eq('evento_id', evento.id).maybeSingle(),
        supabase.from('eventos_agenda').select('*').eq('evento_id', evento.id).order('ordem', { ascending: true }),
      ]);

      const configData = configRes.data as Configuracao | null;
      if (agendaRes.data) setAgenda(agendaRes.data);

      if (!configData || configData.modo_convite !== 'link_unico') {
        // Evento existe mas não está (ou não está mais) no modo Link Único
        // — não deixa criar convite por engano num evento tradicional.
        setModoInvalido(true);
        setLoading(false);
        return;
      }

      setEventoId(evento.id);
      setConfig(configData);

      const [year, month, day] = configData.data_casamento.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setCouple({
        noiva: configData.noiva_nome,
        noivo: configData.noivo_nome,
        data: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        rawDate: configData.data_casamento,
      });

      setLoading(false);
    }
    init();
  }, [eventoSlug, router]);

  if (loading) return <div className={styles.loading}>Acolhendo seu convite...</div>;

  if (notFound || modoInvalido || !config || !eventoId) {
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
      visibility={{
        historia: config.mostrar_historia !== false,
        noivos: config.mostrar_noivos !== false,
        faq: config.mostrar_faq !== false,
        presentes: config.mostrar_presentes !== false,
      }}
      agenda={agenda}
      slug={eventoSlug}
      showGateway={false}
      autoCadastro={{ eventoId, eventoSlug }}
    />
  );
}
