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

export default function InvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [couple, setCouple] = useState({ 
    noiva: 'Layslla', 
    noivo: 'Marcus', 
    data: '13 de Junho de 2026',
    rawDate: '2026-06-13'
  });
  
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

  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <HeroCarousel />
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
      <RSVP inviteSlug={slug} />
      {visibility.faq && <FAQ eventoId={config.evento_id} />}
    </>
  );
}
