'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Convite, Configuracao } from '@/lib/types/database';
import MuralSection from '@/components/sections/MuralSection';
import styles from '../presentes/Presentes.module.css';

export default function MuralPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<Convite | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const params = new URLSearchParams(window.location.search);
      const inviteSlug = params.get('invite');
      
      if (!inviteSlug) {
        setIsInvited(false);
        setLoading(false);
        return;
      }

      const { data: inviteData } = await supabase
        .from('convites')
        .select('*')
        .eq('slug', inviteSlug)
        .maybeSingle();

      if (!inviteData) {
        setIsInvited(false);
        setLoading(false);
        return;
      }

      setIsInvited(true);
      setInvite(inviteData as Convite);

      const { data: configRes } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('evento_id', inviteData.evento_id)
        .maybeSingle();

      if (configRes) {
        setConfig(configRes as Configuracao);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <main className={styles.main} style={{ minHeight: '100vh', background: config?.bg_primary || '#FAF9F6' }}>
      <header className={styles.header}>
        <div className={styles.topNav}>
          <Link href={`/inv/${invite?.slug || ''}`} className={styles.backLink}>
            ← Voltar ao Convite
          </Link>
        </div>
      </header>

      {loading ? (
        <p className={styles.loading}>Preparando mural...</p>
      ) : isInvited === false ? (
        <div className={styles.restricted}>
           <h2 className="cursive">Acesso Reservado</h2>
           <p>Por favor, use o link enviado no seu convite para acessar o mural.</p>
        </div>
      ) : (
        <MuralSection eventoId={invite?.evento_id || ''} config={config!} />
      )}
    </main>
  );
}
