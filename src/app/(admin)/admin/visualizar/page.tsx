'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';
import { Configuracao } from '@/lib/types/database';
import LiveInviteView from '@/components/public/LiveInviteView';
import { useRouter } from 'next/navigation';

export default function VisualizarPreviewPage() {
  const { currentEvent, loading: contextLoading } = useEvent();
  const router = useRouter();

  const [config, setConfig] = useState<Configuracao | null>(null);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couple, setCouple] = useState({
    noiva: 'Noiva',
    noivo: 'Noivo',
    data: 'Carregando data...',
    rawDate: ''
  });
  const [visibility, setVisibility] = useState({
    historia: true, noivos: true, faq: true, presentes: true
  });

  const [showGateway, setShowGateway] = useState(false);

  useEffect(() => {
    if (!contextLoading && !currentEvent) {
      router.push('/admin/dashboard');
      return;
    }

    async function fetchPreviewData() {
      if (!currentEvent) return;
      try {
        setLoading(true);
        const [configRes, agendaRes] = await Promise.all([
          supabase
            .from('configuracoes')
            .select('*')
            .eq('evento_id', currentEvent.id)
            .maybeSingle(),
          supabase
            .from('eventos_agenda')
            .select('*')
            .eq('evento_id', currentEvent.id)
            .order('ordem', { ascending: true })
        ]);

        if (agendaRes.data) setAgenda(agendaRes.data);

        const configData = configRes.data;
        if (configData) {
          setConfig(configData);
          
          const [year, month, day] = configData.data_casamento.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
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
          
          // Inicia a animação do gateway após carregar os dados apenas se não tiver skip_gateway
          const skip = new URLSearchParams(window.location.search).get('skip_gateway') === 'true';
          if (!skip) {
            setShowGateway(true);
          }
        }
      } catch (err) {
        console.error('Erro ao preparar preview:', err);
      } finally {
        setLoading(false);
      }
    }

    if (currentEvent) {
      fetchPreviewData();
    }
  }, [currentEvent, contextLoading, router]);

  if (contextLoading || loading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontFamily: 'sans-serif', background: '#fff', color: '#666' 
      }}>
        Preparando sua simulação...
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Não conseguimos carregar as configurações deste evento.
      </div>
    );
  }

  return (
    <LiveInviteView 
      config={config}
      couple={couple}
      visibility={visibility}
      agenda={agenda}
      slug="preview"
      isPreviewMode={true}
      showGateway={showGateway}
      onGatewayComplete={() => setShowGateway(false)}
    />
  );
}
