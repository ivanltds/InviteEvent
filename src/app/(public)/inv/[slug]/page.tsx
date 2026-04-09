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
import Link from 'next/link';
import HeroCarousel from '@/components/ui/HeroCarousel';

export default function InvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

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
    async function fetchConfig() {
      try {
        const { data } = await supabase
          .from('configuracoes')
          .select('noiva_nome, noivo_nome, data_casamento, mostrar_faq, mostrar_historia, mostrar_noivos, mostrar_presentes')
          .eq('id', 1)
          .maybeSingle();
        
        if (data) {
          const date = new Date(data.data_casamento);
          const formattedDate = date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          });
          
          setCouple({
            noiva: data.noiva_nome,
            noivo: data.noivo_nome,
            data: formattedDate,
            rawDate: data.data_casamento
          });

          setVisibility({
            historia: data.mostrar_historia !== false,
            noivos: data.mostrar_noivos !== false,
            faq: data.mostrar_faq !== false,
            presentes: data.mostrar_presentes !== false
          });
        }
      } catch (e) {
        console.error('Erro ao buscar configurações iniciais:', e);
      }
    }
    fetchConfig();
  }, []);

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
      
      {visibility.historia && <Historia />}
      {visibility.noivos && <OsNoivos />}
      <Detalhes />
      <RSVP inviteSlug={slug} />
      {visibility.faq && <FAQ />}
    </>
  );
}
