'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Convite, Configuracao } from '@/lib/types/database';
import MuralSection from '@/components/sections/MuralSection';
import styles from '../presentes/Presentes.module.css';
import { Telemetry } from '@/lib/services/telemetryService';

export default function MuralPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<Convite | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const sessionStartRef = useRef<number>(Date.now());
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const params = new URLSearchParams(window.location.search);
      const inviteSlug = params.get('invite');
      const previewMode = params.get('preview') === 'true';
      const queryEventId = params.get('eventId');
      
      setIsPreview(previewMode);

      if (!inviteSlug && !previewMode) {
        setIsInvited(false);
        setLoading(false);
        return;
      }

      let inviteData = null;
      if (inviteSlug && inviteSlug !== 'preview') {
        const { data } = await supabase
          .from('convites')
          .select('*')
          .eq('slug', inviteSlug)
          .maybeSingle();
        inviteData = data;
      }

      if (!inviteData && !previewMode) {
        setIsInvited(false);
        setLoading(false);
        return;
      }

      setIsInvited(true);
      
      // Fallback event payload
      const resolvedEventId = inviteData?.evento_id || queryEventId;
      setActiveEventId(resolvedEventId || null);
      const activeEventId = resolvedEventId;
      
      setInvite(inviteData as Convite || { 
        id: 'demo_mural', 
        nome_principal: 'Convidado Exemplo', 
        evento_id: activeEventId || 'demo' 
      });

      if (!activeEventId) {
        setLoading(false);
        return;
      }

      const { data: configRes } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('evento_id', activeEventId)
        .maybeSingle();

      if (configRes) {
        setConfig(configRes as Configuracao);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  // Rastrear tempo de sessão total no Mural (dispara ao sair/desmontar)
  useEffect(() => {
    if (!activeEventId || isPreview) return;
    sessionStartRef.current = Date.now();
    return () => {
      const durationMs = Date.now() - sessionStartRef.current;
      if (durationMs > 3000) { // Mínimo 3s para ser contabilizado
        Telemetry.track({
          eventoId: activeEventId,
          categoria: 'mural',
          eventType: 'mural_session_view',
          durationMs,
          metadata: { scroll_y: window.scrollY },
        });
      }
    };
  }, [activeEventId, isPreview]);

  return (
    <main className={styles.main} style={{ minHeight: '100vh', background: config?.bg_primary || '#FAF9F6', position: 'relative' }}>
      {/* Botão Voltar para Admin se estiver em Modo Preview */}
      {isPreview && (
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
      
      <header className={styles.header}>
        <div className={styles.topNav}>
          <Link 
            href={isPreview ? '/admin/visualizar?skip_gateway=true' : `/inv/${invite?.slug || ''}`} 
            className={styles.backLink}
          >
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
        <MuralSection 
          eventoId={invite?.evento_id || ''} 
          config={config!} 
          isPreviewMode={isPreview}
        />
      )}
    </main>
  );
}
