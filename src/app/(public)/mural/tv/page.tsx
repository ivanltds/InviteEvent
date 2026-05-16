'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { muralService } from '@/lib/services/muralService';
import { MuralItem, Configuracao } from '@/lib/types/database';
import styles from './TvMural.module.css';

function TvMuralContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [items, setItems] = useState<MuralItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Notificação Realtime
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Upload URL do QR code dinâmico
  const [uploadUrl, setUploadUrl] = useState('');

  // 1. Carregar Configurações Temáticas e QR Code
  useEffect(() => {
    if (!eventId) {
      setError('ID do Evento ausente na URL.');
      setLoading(false);
      return;
    }

    async function fetchConfig() {
      const { data, error: err } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('evento_id', eventId)
        .maybeSingle();
      
      if (data) {
        setConfig(data as Configuracao);
      }
      
      // O QR code aponta para a rota normal do mural do evento
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setUploadUrl(`${origin}/mural?eventId=${eventId}`);
    }

    fetchConfig();
  }, [eventId]);

  // 2. Carregar Dados Iniciais do Mural
  useEffect(() => {
    if (!eventId) return;

    async function fetchInitialItems() {
      try {
        const data = await muralService.getApprovedItems(eventId!);
        if (data.length > 0) {
          // Embaralha inicialmente para ficar dinâmico
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setItems(shuffled);
        }
      } catch (err) {
        console.error('Erro ao carregar itens do mural:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialItems();
  }, [eventId]);

  // 3. Escuta em Tempo Real (Supabase Realtime Channels)
  useEffect(() => {
    if (!eventId) return;

    function injectNewItem(item: MuralItem) {
      // Injeta na lista de itens
      setItems(prevItems => {
        // Evita duplicidade
        if (prevItems.some(i => i.id === item.id)) return prevItems;
        
        const newItems = [...prevItems];
        // Insere logo a seguir ao slide atual para ser o próximo a passar
        const targetIndex = prevItems.length === 0 ? 0 : (currentIndex + 1) % (prevItems.length + 1);
        newItems.splice(targetIndex, 0, item);
        return newItems;
      });

      // Notifica visualmente
      setShowToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3500);

      // Salta para o novo slide imediatamente (se houver itens)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % (items.length + 1));
      }, 1200);
    }

    const channel = supabase.channel(`mural-tv-${eventId}`)
      // 1. Escuta a tabela unificada mural_itens
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mural_itens',
          filter: `evento_id=eq.${eventId}`
        },
        (payload: any) => {
          const newItem = payload.new as MuralItem;
          if (newItem.aprovado) {
            injectNewItem(newItem);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mural_itens',
          filter: `evento_id=eq.${eventId}`
        },
        (payload: any) => {
          const updated = payload.new as MuralItem;
          if (updated.aprovado) {
            injectNewItem(updated);
          }
        }
      )
      // 2. Escuta a tabela complementar de mural_mensagens
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mural_mensagens',
          filter: `evento_id=eq.${eventId}`
        },
        (payload: any) => {
          const newMsg = payload.new;
          if (newMsg.status === 'aprovado') {
            injectNewItem({
              id: newMsg.id,
              evento_id: newMsg.evento_id,
              tipo: 'MENSAGEM',
              mensagem: newMsg.mensagem,
              autor: newMsg.nome_convidado,
              aprovado: true,
              criado_em: newMsg.created_at
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mural_mensagens',
          filter: `evento_id=eq.${eventId}`
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated.status === 'aprovado') {
            injectNewItem({
              id: updated.id,
              evento_id: updated.evento_id,
              tipo: 'MENSAGEM',
              mensagem: updated.mensagem,
              autor: updated.nome_convidado,
              aprovado: true,
              criado_em: updated.created_at
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [eventId, currentIndex, items.length]);

  // 4. Loop Automático do Slideshow (Intervalo de 8 segundos)
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [items.length]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
        >
          Preparando Projeção do Mural...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erro na Projeção</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${styles.viewport} ${styles.textOnlyMode}`}>
        <div className={styles.contentHalf}>
          <h1 className={styles.messageQuote} style={{ fontFamily: config?.font_serif }}>
            "Bem-vindos ao nosso mural dinâmico! Compartilhe a primeira lembrança do dia através do QR code no canto da tela."
          </h1>
          <span className={styles.messageAuthor} style={{ color: config?.accent_color }}>
            {config?.noiva_nome && config?.noivo_nome ? `${config.noiva_nome} & ${config.noivo_nome}` : 'Os Noivos'}
          </span>
        </div>

        <div className={styles.footer}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(uploadUrl)}`}
            className={styles.qrImg}
            alt="QR Code Upload"
          />
          <div className={styles.footerText}>
            <h4>Envie sua foto ou recado</h4>
            <p>Aponte o celular e eternize seu carinho</p>
          </div>
        </div>
      </div>
    );
  }

  const activeItem = items[currentIndex];
  const isOnlyMessage = activeItem.tipo === 'MENSAGEM' || !activeItem.url_midia;
  const accentColor = config?.accent_color || '#C5A059';
  const fontStyle = config?.font_serif ? { fontFamily: config.font_serif } : {};

  // Dynamic style configuration variables
  const dynamicStyle = {
    '--accent': accentColor,
    '--font-serif': config?.font_serif || "'Playfair Display', serif"
  } as React.CSSProperties;

  return (
    <div 
      className={`${styles.viewport} ${isOnlyMessage ? styles.textOnlyMode : ''}`}
      style={dynamicStyle}
    >
      {/* Banner Realtime */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className={styles.toastNotify}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            NOVA LEMBRANÇA NO TELÃO!
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.splitContainer}>
        {/* LADO DA MÍDIA */}
        {!isOnlyMessage && (
          <div className={styles.mediaHalf}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`blur-${activeItem.id}`}
                className={styles.bgBlur}
                style={{ backgroundImage: `url(${activeItem.url_midia})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeItem.tipo === 'VIDEO' ? (
                <motion.video
                  key={`video-${activeItem.id}`}
                  src={activeItem.url_midia}
                  className={styles.videoDisplay}
                  autoPlay
                  muted
                  loop
                  playsInline
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              ) : (
                <motion.img
                  key={`img-${activeItem.id}`}
                  src={activeItem.url_midia}
                  className={styles.photoDisplay}
                  alt="Lembrança do Mural"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* LADO DO TEXTO */}
        <div className={styles.contentHalf}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeItem.id}`}
              className={styles.quoteTarget}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <blockquote className={styles.messageQuote} style={fontStyle}>
                "{activeItem.mensagem || 'Que momento maravilhoso!'}"
              </blockquote>
              <div className={styles.messageAuthor}>
                {activeItem.autor || 'Convidado Especial'}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* QR CODE FIXO */}
      <div className={styles.footer}>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(uploadUrl)}`}
          className={styles.qrImg}
          alt="QR Code Upload"
        />
        <div className={styles.footerText}>
          <h4>Envie sua foto ou recado</h4>
          <p>Acesse o Mural pelo celular e eternize o dia</p>
        </div>
      </div>
    </div>
  );
}

export default function TvMuralPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Carregando tela de projeção...</div>}>
      <TvMuralContent />
    </Suspense>
  );
}
