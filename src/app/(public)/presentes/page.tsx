'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from "./Presentes.module.css";
import { CldUploadWidget } from 'next-cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Award, Star, Gift, Palmtree, GlassWater, PartyPopper, Coffee, Plane, Music, Smile, Camera } from 'lucide-react';
import { Convite, Presente } from '@/lib/types/database';
import { generatePixPayload } from '@/lib/utils/pix';
import { triggerCelebration, triggerSideCannons } from '@/lib/utils/confetti';
import EmotionalIntro from '@/components/gifts/EmotionalIntro';
import FloatingBasket from '@/components/gifts/FloatingBasket';
import MuralSection from '@/components/sections/MuralSection';
import PaymentSelector from '@/components/gifts/PaymentSelector';
import { giftService, GiftProgress } from '@/lib/services/giftService';
import { inviteService } from '@/lib/services/inviteService';
import { configService } from '@/lib/services/configService';
import { Telemetry } from '@/lib/services/telemetryService';

interface Config {
  pix_chave: string;
  pix_banco: string;
  pix_nome: string;
  pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  accent_color?: string;
  allow_stripe?: boolean;
  font_serif?: string;
  font_cursive?: string;
}

export default function PresentesPage() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [config, setConfig] = useState<Config | null>(null);
  const [cart, setCart] = useState<Presente[]>([]);
  const [selectedGift, setSelectedGift] = useState<Presente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<Convite | null>(null);
  const [pixCopyStatus, setPixCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [specialMessage, setSpecialMessage] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const modalOpenTimeRef = useRef<number>(0);
  const paymentAttemptRef = useRef<number>(0);

  // NOVOS ESTADOS PRD-12B
  const [guestSessionId, setGuestSessionId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const [redirectGift, setRedirectGift] = useState<Presente | null>(null);

  // NOVOS ESTADOS PRD-12C (Pre-Flight Link Guard)
  const [isValidatingLink, setIsValidatingLink] = useState(false);
  const [linkValidationFailed, setLinkValidationFailed] = useState(false);
  const [search, setSearch] = useState('');

  // NOVOS ESTADOS PRD-014 (Gestão de Cotas na UI Pública)
  const [quotaProgress, setQuotaProgress] = useState<GiftProgress | null>(null);
  const [selectedQuotas, setSelectedQuotas] = useState(1);
  const [isQuotaFlow, setIsQuotaFlow] = useState(false);
  const [isReservingQuotaLock, setIsReservingQuotaLock] = useState(false);
  const [quotaSelectedGift, setQuotaSelectedGift] = useState<Presente | null>(null);
  const [affinityData, setAffinityData] = useState<Record<string, any>>({});

  // Busca reativa inteligente para os convidados (Smart Sorting Hierarchy PRD-015)
  const filteredPresentes = useMemo(() => {
    const q = search.toLowerCase();
    const items = presentes.filter(item => 
      item.nome?.toLowerCase().includes(q) || 
      item.descricao?.toLowerCase().includes(q)
    );

    // Hierarquia de Ordenação Luxo
    items.sort((a, b) => {
      // 1. Esgotados por último (Respeitando modalidade de Cotas PRD-014 e Locks PRD-12B)
      const getEffectiveSoldOut = (item: Presente) => {
        if (item.permite_cotas) {
          const totalLocked = item.presentes_locks?.reduce((acc, l) => {
            return new Date(l.expira_em).getTime() > Date.now() ? acc + (l.quantidade_cotas || 1) : acc;
          }, 0) || 0;
          return (item.cotas_compradas || 0) + totalLocked >= (item.total_cotas || 1);
        }
        const hasLock = item.presentes_locks?.some(l => new Date(l.expira_em).getTime() > Date.now());
        return item.quantidade_reservada >= item.quantidade_total || item.status === 'reservado' || hasLock;
      };

      const isAUnavailable = getEffectiveSoldOut(a) || a.status === 'pausado';
      const isBUnavailable = getEffectiveSoldOut(b) || b.status === 'pausado';
      
      if (isAUnavailable && !isBUnavailable) return 1;
      if (!isAUnavailable && isBUnavailable) return -1;

      // 2. Prioridade Manual "Grande Sonho"
      if (a.is_sonho_casal && !b.is_sonho_casal) return -1;
      if (!a.is_sonho_casal && b.is_sonho_casal) return 1;

      // 3. Score de Afinidade Telemetria
      const scoreA = affinityData[a.id]?.score ?? 0;
      const scoreB = affinityData[b.id]?.score ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // 4. Fallback: Recentes primeiro
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return items;
  }, [presentes, search, affinityData]);

  // PRD-014: Determina se a compra integral deve ser bloqueada
  const isFullPurchaseDisabled = useMemo(() => {
    if (!selectedGift) return false;
    if (!selectedGift.permite_cotas) return false;
    
    // Se permite cotas, só bloqueia a compra integral se pelo menos UMA cota já tiver sido vendida
    const soldCount = quotaProgress?.cotas_compradas ?? selectedGift.cotas_compradas ?? 0;
    return soldCount > 0;
  }, [selectedGift, quotaProgress]);

  // Computa se o presente atualmente focado em modal está reservado por mim
  const isSelectedGiftLockedByMe = useMemo(() => {
    if (!selectedGift) return false;
    return selectedGift.presentes_locks?.some(lock => 
      lock.session_id === guestSessionId && new Date(lock.expira_em).getTime() > currentTime
    );
  }, [selectedGift, guestSessionId, currentTime]);

  // Pega o timestamp exato em que o lock do presente focado expira
  const selectedGiftLockExpireTime = useMemo(() => {
    if (!selectedGift) return null;
    const lock = selectedGift.presentes_locks?.find(lock => 
      lock.session_id === guestSessionId && new Date(lock.expira_em).getTime() > currentTime
    );
    return lock ? new Date(lock.expira_em).getTime() : null;
  }, [selectedGift, guestSessionId, currentTime]);

  // Formata o relógio dinâmico (HH:MM:SS) para exibir no modal do Dono do Lock
  const remainingTimeText = useMemo(() => {
    if (!selectedGiftLockExpireTime) return '';
    const diff = selectedGiftLockExpireTime - currentTime;
    if (diff <= 0) return 'Expira em instantes';
    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [selectedGiftLockExpireTime, currentTime]);

  // Reatividade ao segundo para atualizar timers do PRD-12B
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // PRD-014: Sincronizador dinâmico do progresso de cotas
  useEffect(() => {
    if (selectedGift && selectedGift.permite_cotas) {
      setSelectedQuotas(1);
      setQuotaProgress(null);
      giftService.getGiftProgress(selectedGift.id).then(res => {
        if (res) setQuotaProgress(res);
      });
    } else {
      setQuotaProgress(null);
    }
  }, [selectedGift]);

  // Controle do Contador e Redirecionamento Intersticial (Story-Redir)
  // Modificado no PRD-12C para cessar redirecionamento se acusar linkQuebrado
  useEffect(() => {
    if (!isRedirecting || !redirectGift || linkValidationFailed) return;

    const interval = setInterval(() => {
      // Verificação dupla interna antes de subtrair
      if (linkValidationFailed) {
        clearInterval(interval);
        return;
      }

      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRedirecting(false);
          if (redirectGift.link_externo) {
            window.open(redirectGift.link_externo, '_blank');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRedirecting, redirectGift, linkValidationFailed]);

  // Inicialização da Sessão de Identidade e Carga de Dados
  useEffect(() => {
    // Identidade anônima no dispositivo para soberania de travas
    let storedSession = localStorage.getItem('invite_event_guest_session');
    if (!storedSession) {
      storedSession = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('invite_event_guest_session', storedSession);
    }
    setGuestSessionId(storedSession);

    async function fetchData() {
      setLoading(true);
      
      const params = new URLSearchParams(window.location.search);
      const inviteSlug = params.get('invite');
      const previewMode = params.get('preview') === 'true';
      
      setIsPreview(previewMode);

      if (!inviteSlug && !previewMode) {
        setIsInvited(false);
        setLoading(false);
        return;
      }



      if (previewMode) {
        // IN PREVIEW, we can't fetch by invite slug usually, or it might be missing.
      }
      
      // For now, try to get invite data if exists
      let inviteData = null;
      if (inviteSlug && inviteSlug !== 'preview') {
        inviteData = await inviteService.getInviteBySlug(inviteSlug);
      }

      if (!inviteData && !previewMode) {
        setIsInvited(false);
        setLoading(false);
        return;
      }

      setIsInvited(true);
      setInvite(inviteData as Convite || { id: 'demo', nome_principal: 'Convidado Exemplo', evento_id: 'demo' });

      // How do we get real gifts if inviteData doesn't exist in preview?
      const queryEventId = params.get('eventId');
      const targetEventId = inviteData?.evento_id || queryEventId;
      if (targetEventId) setEventoId(targetEventId);

      if (!targetEventId) {
        setLoading(false);
        return;
      }

      const [configRes, presentesRes] = await Promise.all([
        configService.getConfig(targetEventId),
        giftService.getPublicGifts(targetEventId)
      ]);

      if (presentesRes) {
        setPresentes(presentesRes as Presente[]);
      }
      
      if (configRes) {
        setConfig(configRes as Config);
      }
      
      setLoading(false);

      // PRD-015: Busca dados de afinidade em background (cache distribuído)
      if (targetEventId && !previewMode) {
        fetch(`/api/public/presentes/fomo?eventoId=${targetEventId}`)
          .then(res => res.json())
          .then(res => {
            if (res.success) setAffinityData(res.data);
          })
          .catch(() => {});
      }

      // Mostrar intro emocional apenas uma vez por sessão
      const introSeen = sessionStorage.getItem('gift_intro_seen');
      if (!introSeen) {
        setShowIntro(true);
        sessionStorage.setItem('gift_intro_seen', 'true');
      }
    }
    fetchData();
  }, []);

  const totalCartValue = useMemo(() => {
    if (isQuotaFlow && quotaSelectedGift) {
      const valorCota = Number(quotaSelectedGift.preco) / (Number(quotaSelectedGift.total_cotas) || 1);
      return valorCota * selectedQuotas;
    }
    return cart.reduce((acc, item) => acc + Number(item.preco), 0);
  }, [cart, isQuotaFlow, quotaSelectedGift, selectedQuotas]);

  const toggleToCart = (item: Presente) => {
    const isAdding = !cart.find(p => p.id === item.id);
    if (!isAdding) {
      setCart(prev => prev.filter(p => p.id !== item.id));
    } else {
      setCart(prev => [...prev, item]);
      // Telemetria: Adição ao carrinho para alimentar o FOMO
      if (eventoId && !isPreview) {
        Telemetry.track({
          eventoId,
          categoria: 'gift',
          eventType: 'add_to_cart',
          targetId: item.id,
          metadata: { item_name: item.nome, item_price: item.preco }
        });
      }
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setStep('checkout');
    setShowModal(true);
    setPixCopyStatus('idle');
    paymentAttemptRef.current += 1;
    // Telemetria: início do funil de pagamento
    if (eventoId && !isPreview) {
      Telemetry.track({
        eventoId,
        categoria: 'gift',
        eventType: 'checkout_init',
        metadata: {
          cart_item_count: cart.length,
          cart_total_value: cart.reduce((acc, p) => acc + Number(p.preco), 0),
          cart_item_ids: cart.map(p => p.id),
          attempt_number: paymentAttemptRef.current,
        },
      });
    }
  };

  // NOVOS MÉTODOS DE RESERVAS TEMPORÁRIAS (PRD-12B)
  const handleAffiliateClick = async (gift: Presente) => {
    if (!gift.link_externo) return;
    
    // Reset de Estados de Validação (PRD-12C)
    setLinkValidationFailed(false);
    setIsValidatingLink(true);
    
    // 1. Geração do Token de Reconciliação Offline (PRD-12C)
    const clickToken = 'AEG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    // 2. Normalização e Anexo de parâmetro de rastreamento Lomadee sourceId (Evita link relativo)
    let originalLink = gift.link_externo.trim();
    if (!originalLink.startsWith('http://') && !originalLink.startsWith('https://')) {
      originalLink = `https://${originalLink}`;
    }
    const separator = originalLink.includes('?') ? '&' : '?';
    const trackedLink = `${originalLink}${separator}source=${clickToken}`;
    
    // 3. Exibe a overlay intersticial 4s com o link rastreado e normalizado
    setRedirectGift({ ...gift, link_externo: trackedLink });
    setIsRedirecting(true);
    setRedirectCountdown(4);
    
    // 4. Fecha o modal de detalhes
    setSelectedGift(null);

    // 5. Registra Telemetria de Clique Externo (Leakage Prevention + Tracking Token)
    if (eventoId && !isPreview) {
      Telemetry.track({
        eventoId,
        categoria: 'gift',
        eventType: 'external_link_click',
        targetId: gift.id,
        metadata: {
          item_name: gift.nome,
          potential_loss_value: gift.preco,
          external_url: gift.link_externo,
          token: clickToken, // TOKEN DA CONCILIAÇÃO OFFLINE
        },
      });
    }

    // 6. DISPARO SILENCIOSO DE VALIDAÇÃO SERVER-SIDE (PRD-12C Pre-Flight Link Guard)
    const startValidation = async () => {
      try {
        const response = await fetch(`/api/intelligence/autonomy/validate?url=${encodeURIComponent(trackedLink)}`);
        const data = await response.json();
        
        if (data.valid === false) {
          // A API de Verificação detectou 404 ou Timeout crítico!
          setLinkValidationFailed(true);
          
          // Envia o reporte silencioso imediato para a fila do cérebro autônomo
          if (!isPreview) {
            // 1. Reporta o link quebrado para o painel de cura
            await giftService.reportBrokenLink(
              gift.id, 
              gift.base_id || null, 
              trackedLink, 
              `Pre-Flight Guard Detectou Falha: HTTP ${data.status || 'DESCONHECIDO'} - ${data.message || 'Link Morto'}`
            );

            // 2. LIBERAÇÃO TRANSACIONAL DE LOCK (PRD-12C)
            // Como o link está quebrado, cancelamos o lock atômico imediatamente!
            try {
              await giftService.unlockGift(gift.id, guestSessionId);
              
              // Reverte o estado em memória instantaneamente para a vitrine
              setPresentes(prev => prev.map(p => {
                if (p.id === gift.id) {
                  return {
                    ...p,
                    presentes_locks: (p.presentes_locks || []).filter(l => l.session_id !== guestSessionId)
                  };
                }
                return p;
              }));
            } catch (unlockErr) {
              console.warn('[PreFlight] Erro ao reverter lock transacional:', unlockErr);
            }
            
            // Telemetria adicional para Rastreio de Auto-Cura Injetada
            if (eventoId) {
              Telemetry.track({
                eventoId,
                categoria: 'gift',
                eventType: 'broken_link_auto_reported',
                targetId: gift.id,
                metadata: {
                  item_name: gift.nome,
                  broken_url: trackedLink,
                  failure_code: data.status
                }
              });
            }
          }
        }
      } catch (valErr) {
        console.warn('[PreFlight] Erro ao invocar API de validação:', valErr);
      } finally {
        setIsValidatingLink(false);
      }
    };
    startValidation(); // Roda paralelo ao countdown!

    try {
      if (!isPreview) {
        // Tenta adquirir o lock atômico de 3h no banco de dados amarrado ao convite!
        const res = await giftService.lockGift(gift.id, guestSessionId, invite?.id);
        
        if (res.sucesso) {
          // Atualização otimista em memória imediata
          setPresentes(prev => prev.map(p => {
            if (p.id === gift.id) {
              const newLock = {
                id: 'temp_' + Date.now(),
                presente_id: gift.id,
                session_id: guestSessionId,
                convite_id: invite?.id,
                expira_em: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
              };
              return {
                ...p,
                presentes_locks: [...(p.presentes_locks || []).filter(l => l.session_id !== guestSessionId), newLock]
              };
            }
            return p;
          }));
        } else {
          // Feedback empático de conflito (PRD-018)
          alert('Tivemos um pequeno tropeço... Este item acabou de ser escolhido por outro convidado.');
          setIsRedirecting(false); // Interrompe o countdown
          setRedirectGift(null);
        }
      }
    } catch (err) {
      console.error('Erro ao registrar trava temporária:', err);
    }
  };

  const handleReleaseReserve = async (gift: Presente) => {
    try {
      if (!isPreview) {
        await giftService.unlockGift(gift.id, guestSessionId);
      }
      
      // Remover lock das variáveis locais
      setPresentes(prev => prev.map(p => {
        if (p.id === gift.id) {
          return {
            ...p,
            presentes_locks: (p.presentes_locks || []).filter(l => l.session_id !== guestSessionId)
          };
        }
        return p;
      }));
      
      setSelectedGift(null);
    } catch (err) {
      console.error('Falha ao liberar trava:', err);
    }
  };

  const handleDirectPix = (gift: Presente) => {
    // 1. Injetar o item no carrinho instantaneamente
    if (!cart.some(p => p.id === gift.id)) {
      setCart(prev => [...prev, gift]);
    }
    
    // 2. Oculta visual de detalhes
    setSelectedGift(null);
    
    // 3. Telemetria acelerada
    if (eventoId && !isPreview) {
      Telemetry.track({
        eventoId,
        categoria: 'gift',
        eventType: 'direct_pix_intent',
        targetId: gift.id,
        metadata: { item_name: gift.nome, item_price: gift.preco },
      });
    }
    
    // 4. Abre modal no passo checkout
    setStep('checkout');
    setShowModal(true);
  };

  const handleReserveQuotaAndCheckout = async () => {
    if (!selectedGift) return;
    
    setIsReservingQuotaLock(true);
    
    try {
      let success = true;
      if (!isPreview) {
        success = await giftService.reserveGiftFraction(
          selectedGift.id, 
          selectedQuotas, 
          invite?.id || '', 
          guestSessionId
        );
      }
      
      if (!success) {
        alert('Desculpe, não há cotas disponíveis suficientes no momento ou outro convidado acabou de reservar.');
        setIsReservingQuotaLock(false);
        return;
      }
      
      setQuotaSelectedGift(selectedGift);
      setIsQuotaFlow(true);
      setStep('checkout');
      setShowModal(true);
      setSelectedGift(null);
    } catch (err) {
      console.error('Erro ao travar cota temporária:', err);
    } finally {
      setIsReservingQuotaLock(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setPixCopyStatus('copied');
    setTimeout(() => setPixCopyStatus('idle'), 3000);
  };

  const handleUploadSuccess = async (result: unknown) => {
    if (cart.length === 0) return;

    const info = (result as { info?: { secure_url?: string } })?.info;
    const proofUrl = info?.secure_url;
    if (!proofUrl) return;

    try {
      let success = false;
      
      if (isPreview) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        success = true;
      } else if (isQuotaFlow && quotaSelectedGift) {
        success = await giftService.reserveQuotaFinalization({
          presenteId: quotaSelectedGift.id,
          urlComprovante: proofUrl,
          quantidadeCotas: selectedQuotas,
          conviteId: invite?.id,
          eventoId: invite?.evento_id,
          convidadoNome: invite?.nome_principal || 'Convidado via Site',
          mensagem: specialMessage
        });
      } else {
        const response = await giftService.reserveGifts({
          presentesIds: cart.map(p => p.id),
          urlComprovante: proofUrl,
          mensagem: specialMessage,
          conviteId: invite?.id,
          eventoId: invite?.evento_id,
          convidadoNome: invite?.nome_principal || 'Convidado via Site'
        }) as { success: boolean; message: string };
        success = response.success;
      }

      if (!success) {
        if (eventoId && !isPreview) {
          Telemetry.track({
            eventoId,
            categoria: 'gift',
            eventType: 'payment_error',
            metadata: { attempt_number: paymentAttemptRef.current },
          });
        }
        return;
      }

      if (eventoId && !isPreview) {
        Telemetry.track({
          eventoId,
          categoria: 'gift',
          eventType: 'payment_success',
          metadata: {
            total_attempts: paymentAttemptRef.current,
            cart_item_count: isQuotaFlow ? 1 : cart.length,
            cart_total_value: totalCartValue,
            is_quota: isQuotaFlow,
          },
        });
      }

      if (!isPreview && !isQuotaFlow) {
        cart.forEach(p => {
          giftService.unlockGift(p.id, guestSessionId).catch(() => {});
        });
      }

      // Atualização local reativa para ambos os cenários
      if (isQuotaFlow && quotaSelectedGift) {
        setPresentes(prev => prev.map(p => {
          if (p.id === quotaSelectedGift.id) {
            const currentBought = Number(p.cotas_compradas) || 0;
            const newBought = currentBought + selectedQuotas;
            const total = Number(p.total_cotas) || 1;
            return {
              ...p,
              cotas_compradas: newBought,
              status: newBought >= total ? 'esgotado' : 'disponivel'
            };
          }
          return p;
        }));
      } else {
        const updatedIds = cart.map(p => p.id);
        setPresentes(prev => prev.map(p => {
          if (updatedIds.includes(p.id)) {
            const newQty = p.quantidade_reservada + 1;
            return { 
              ...p, 
              quantidade_reservada: newQty, 
              status: newQty >= p.quantidade_total ? 'reservado' : 'disponivel',
              presentes_locks: (p.presentes_locks || []).filter(l => l.session_id !== guestSessionId)
            };
          }
          return p;
        }));
      }

      setStep('success');
      paymentAttemptRef.current = 0; // reset para próxima compra
      
      // CELEBRAÇÃO WOW! (Story: STORY-052)
      const themeColor = config?.accent_color || '#D4AF37';
      triggerCelebration([themeColor, '#FFFFFF', '#F5E6CC']);
      setTimeout(() => triggerSideCannons(3, [themeColor, '#FFFFFF']), 1000);

    } catch (error) {
      console.error('Erro ao processar presentes:', error);
    }
  };

  const pixPayload = useMemo(() => {
    if (totalCartValue === 0) return '';
    return generatePixPayload(
      config?.pix_chave || 'layysllafabiana@gmail.com',
      config?.pix_nome || 'Layslla Fabiana',
      (config?.pix_tipo || 'email') as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria',
      'SAO PAULO',
      totalCartValue
    );
  }, [config, totalCartValue]);

  return (
    <div className={styles.main}>
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

      {showIntro && (
        <EmotionalIntro 
          onComplete={() => setShowIntro(false)} 
          accentColor={config?.accent_color}
        />
      )}

      <nav className={styles.headerNav}>
        <div></div> {/* Preservar o flexbox de espaço entre elementos */}
        <div className={styles.cartIndicator} onClick={handleOpenCheckout}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> 
            Cesta
          </span>
          <span className={styles.cartCount} style={{ background: config?.accent_color || '#C5A059' }}>
            {cart.length}
          </span>
        </div>
      </nav>

      <header className={styles.header}>
        <div className={styles.topNav} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Link 
            href={isPreview ? '/admin/visualizar?skip_gateway=true' : `/inv/${invite?.slug || ''}`} 
            className={styles.backLink}
          >
            ← Voltar ao Convite
          </Link>
        </div>
        <h1 style={{ color: config?.accent_color, fontFamily: config?.font_serif }}>Lista de Presentes</h1>
        <p className={styles.subtitle}>Seu maior presente é a sua presença. Mas, se desejar nos homenagear, escolha um item de nossa lista de cotas virtuais para nossa nova jornada.</p>
      </header>

      {loading ? (
        <p className={styles.loading}>Preparando lista...</p>
      ) : isInvited === false ? (
        <div className={styles.restricted}>
           <h2 className="cursive">Acesso Reservado</h2>
           <p>Por favor, use o link enviado no seu convite para acessar nossa lista personalizada.</p>
        </div>
      ) : (
        <>
          {/* Campo de Busca Convidado */}
          <div className={styles.searchWrapper}>
            <input 
              type="text"
              className={styles.searchBox}
              style={search ? { borderColor: config?.accent_color || '#1a1a1a' } : {}}
              placeholder="Procurar um presente específico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <section className={styles.grid}>
            {filteredPresentes.slice(0, visibleCount).map((item, index) => {
              const inCart = cart.some(p => p.id === item.id);
              const isSoldOut = item.permite_cotas 
                ? (item.cotas_compradas || 0) >= (item.total_cotas || 1)
                : (item.quantidade_reservada >= item.quantidade_total || item.status === 'reservado');

              // REGRAS DE LOCK PRD-12B / PRD-014: Reagir dinamicamente à modalidade do item
              const totalLockedOthers = item.presentes_locks?.reduce((acc, lock) => {
                const isValid = new Date(lock.expira_em).getTime() > currentTime;
                const isOther = lock.session_id !== guestSessionId;
                return (isValid && isOther) ? acc + (lock.quantidade_cotas || 1) : acc;
              }, 0) || 0;

              const isLockedByMe = item.presentes_locks?.some(lock => 
                lock.session_id === guestSessionId && new Date(lock.expira_em).getTime() > currentTime
              );

              // Para itens exclusivos, qualquer lock de terceiro reserva o item.
              // Para cotas, só reserva se não houver mais saldo disponível (total - compradas - locks_terceiros).
              const isLockedByOther = item.permite_cotas 
                ? ((item.cotas_compradas || 0) + totalLockedOthers >= (item.total_cotas || 1))
                : item.presentes_locks?.some(lock => lock.session_id !== guestSessionId && new Date(lock.expira_em).getTime() > currentTime);

              // Correção de Integridade: Se for cotas, o status 'reservado' é ignorado em favor do saldo de cotas
              const effectiveStatus = (item.permite_cotas && item.status === 'reservado') ? 'disponivel' : item.status;
              const isReserved = isSoldOut || effectiveStatus === 'pausado' || isLockedByOther || (effectiveStatus === 'reservado' && !item.permite_cotas);
              
              return (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: (index % 10) * 0.08 }}
                  layout
                  className={`${styles.card} ${isReserved ? styles.reserved : ''} ${inCart ? styles.cardSelected : ''}`}
                  style={inCart ? { borderColor: config?.accent_color || '#C5A059' } : { cursor: (isReserved && !isLockedByMe) ? 'not-allowed' : 'pointer' }}
                  onClick={() => {
                    // O "Dono da Reserva" pode clicar para gerenciar/pagar seu item travado!
                    if (!isReserved || isLockedByMe) {
                      setSelectedGift(item);
                      modalOpenTimeRef.current = Date.now();
                      // Telemetria: convidado abriu o modal de detalhe do presente
                      if (eventoId && !isPreview) {
                        Telemetry.track({
                          eventoId,
                          categoria: 'gift',
                          eventType: 'gift_item_view',
                          targetId: item.id,
                          metadata: { item_name: item.nome, item_price: item.preco },
                        });
                      }
                    }
                  }}
                >
                  <div className={styles.imagePlaceholder}>
                    {inCart && (
                      <span className={styles.selectedBadge} style={{ background: config?.accent_color || '#C5A059' }}>
                        Selecionado ✓
                      </span>
                    )}
                    {isLockedByMe && !inCart && (
                      <span className={styles.selectedBadge} style={{ background: '#10b981', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}>
                        SUA RESERVA ⏳
                      </span>
                    )}
                    {isLockedByOther && (
                      <span className={styles.selectedBadge} style={{ background: '#ea580c', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}>
                        RESERVADO 🔒
                      </span>
                    )}
                    {/* PRD-015: Badges de Luxo (Dream, Classic, Hot & Custom) */}
                    {!inCart && !isReserved && (
                      <>
                        {/* 1. Destaque Personalizado (Prioridade 1) */}
                        {item.highlight_label && (
                          <div className={styles.luxeBadgeDream} style={{ background: item.highlight_icon === 'classic' ? 'rgba(243, 229, 216, 0.9)' : undefined }}>
                            {(() => {
                              const Icon = {
                                heart: Heart,
                                award: Award,
                                star: Star,
                                gift: Gift,
                                palmtree: Palmtree,
                                glass: GlassWater,
                                party: PartyPopper,
                                coffee: Coffee,
                                plane: Plane,
                                music: Music,
                                smile: Smile,
                                camera: Camera
                              }[item.highlight_icon || 'star'] || Star;
                              return <Icon className={styles.luxeIcon} size={12} strokeWidth={2.5} />;
                            })()}
                            {item.highlight_label}
                          </div>
                        )}

                        {/* 2. Grande Sonho (Prioridade 2 se não houver custom) */}
                        {!item.highlight_label && (item.is_sonho_casal || affinityData[item.id]?.badge === 'dream') && (
                          <div className={styles.luxeBadgeDream}>
                            <Heart className={styles.luxeIcon} size={12} strokeWidth={2.5} />
                            Grande Sonho do Casal
                          </div>
                        )}

                        {/* 3. O Mais Amado (Fogo/Hot - Inteligência de Dados) */}
                        {!item.highlight_label && !item.is_sonho_casal && affinityData[item.id]?.badge === 'hot' && (
                          <div className={styles.luxeBadgeDream} style={{ background: 'rgba(255, 237, 213, 0.95)', border: '1px solid #fdba74' }}>
                            <Star className={styles.luxeIcon} size={12} strokeWidth={2.5} style={{ color: '#ea580c' }} />
                            O Mais Amado 🔥
                          </div>
                        )}

                        {/* 4. Escolha Clássica (Prioridade 4) */}
                        {!item.highlight_label && !item.is_sonho_casal && affinityData[item.id]?.badge === 'classic' && (
                          <div className={styles.luxeBadgeClassic}>
                            <Award className={styles.luxeIcon} size={12} strokeWidth={2.5} />
                            Escolha Clássica
                          </div>
                        )}
                      </>
                    )}

                    {/* PRD-015: Discrete Sparkle for Views (Hover Only via CSS) */}
                    {!inCart && !isReserved && affinityData[item.id]?.viewers >= 2 && (
                      <div className={styles.sparkleContainer}>
                        <svg className={styles.sparkleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        <div className={styles.sparkleTooltip}>Muito cogitado recentemente ✨</div>
                      </div>
                    )}

                    {item.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imagem_url} alt={item.nome} className={styles.itemImage} />
                    ) : (
                      <div className={styles.cardImageFallback}>
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none">
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                          <rect x="2" y="7" width="20" height="5"></rect>
                          <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.description}>{item.descricao || 'EXPERIÊNCIA'}</div>
                    <h3 style={{ fontFamily: config?.font_serif }}>{item.nome}</h3>
                    <div className={styles.price} style={{ color: config?.accent_color || '#C5A059' }}>
                      {item.preco_de && Number(item.preco_de) > Number(item.preco) && (
                        <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 8, fontSize: '0.85em' }}>
                          {Number(item.preco_de).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                      {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    
                    {item.permite_cotas && (
                      <div className={styles.cotaValueBadge}>
                        Cotas de <strong>{(Number(item.preco) / (item.total_cotas || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                    )}

                    {item.permite_cotas && (
                      <div style={{ margin: '12px 0', fontSize: '0.75rem' }}>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(100, ((item.cotas_compradas || 0) / (item.total_cotas || 1)) * 100)}%`, 
                            background: config?.accent_color || '#C5A059',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', marginTop: '4px', fontWeight: 600 }}>
                          <span>{item.cotas_compradas || 0}/{item.total_cotas} cotas</span>
                          <span>{Math.round(((item.cotas_compradas || 0) / (item.total_cotas || 1)) * 100)}%</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={styles.itemActions}>
                      <button 
                        className={styles.giftBtn}
                        style={{ backgroundColor: (isReserved && !isLockedByMe) ? '#ccc' : (isLockedByMe ? '#059669' : (config?.accent_color || '#C5A059')) }}
                        disabled={isReserved && !isLockedByMe}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isReserved || isLockedByMe) setSelectedGift(item); 
                        }}
                      >
                        {isLockedByMe ? 'Sua Reserva ⏳' : (isReserved ? (isLockedByOther ? 'Sob Reserva' : 'Indisponível') : 'Ver Detalhes')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </section>

          {filteredPresentes.length > visibleCount && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0 5rem' }}>
              <button 
                className={styles.giftBtn} 
                style={{ 
                  width: 'auto', 
                  padding: '16px 48px', 
                  backgroundColor: 'white', 
                  color: config?.accent_color || '#C5A059',
                  border: `2px solid ${config?.accent_color || '#C5A059'}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '0.05em'
                }}
                onClick={() => setVisibleCount(prev => prev + 10)}
              >
                VER MAIS PRESENTES
              </button>
            </div>
          )}

          {filteredPresentes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 20px', color: '#71717A', fontSize: '1.1rem' }}>
              Nenhum item corresponde à sua busca. Experimente buscar por outro termo!
            </div>
          )}

          <FloatingBasket 
            count={cart.length} 
            total={totalCartValue} 
            onClick={handleOpenCheckout}
            accentColor={config?.accent_color}
          />

          <div style={{ marginTop: '4rem' }}>
            <MuralSection eventoId={invite?.evento_id || ''} />
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedGift && (
          <div className={styles.modalOverlay} onClick={() => setSelectedGift(null)}>
            <motion.div 
              className={styles.modal}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Left Column: Visual */}
              <div className={styles.modalVisual}>
                {selectedGift.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedGift.imagem_url} alt={selectedGift.nome} />
                ) : (
                  <div className={styles.modalVisualPlaceholder}>
                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none">
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      <rect x="2" y="7" width="20" height="5"></rect>
                      <polyline points="20 12 20 22 4 22 4 12"></polyline>
                    </svg>
                  </div>
                )}
              </div>

              {/* Right Column: Content */}
              <div className={styles.modalContent}>
                <button className={styles.closeBtn} onClick={() => setSelectedGift(null)}>&times;</button>
                <div className={styles.modalTag}>{selectedGift.descricao || 'PRESENTE'}</div>
                <h2 style={{ fontFamily: config?.font_serif, margin: '0 0 10px 0', fontSize: '32px', fontWeight: 600, color: '#1A1A1A' }}>
                  {selectedGift.nome}
                </h2>
                <div className={styles.modalPrice} style={{ color: config?.accent_color || '#C5A059' }}>
                  {selectedGift.preco_de && Number(selectedGift.preco_de) > Number(selectedGift.preco) && (
                    <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 12, fontSize: '0.8em', fontWeight: 400 }}>
                      {Number(selectedGift.preco_de).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  {Number(selectedGift.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                
                <div className={styles.modalDescHeading}>Sobre este presente</div>
                <div className={styles.modalDescText}>
                  {selectedGift.descricao ? (
                    selectedGift.descricao.split('\n').map((line, i) => (
                      <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>
                    ))
                  ) : (
                    <p>Sem descrição detalhada.</p>
                  )}
                </div>
                
                {/* Alerta de Status de Dono da Reserva (PRD-12B) */}
                {isSelectedGiftLockedByMe && (
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    color: '#78350f',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⏳ Você ativou a reserva temporária deste item!
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.4' }}>
                      Ele ficará ocultado para outros convidados enquanto você avalia a compra externa.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                      <strong>Expira em: <span style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>{remainingTimeText}</span></strong>
                      <button 
                        onClick={() => handleReleaseReserve(selectedGift)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b45309',
                          textDecoration: 'underline',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.85rem'
                        }}
                      >
                        Liberar Item Agora
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.modalActions} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* BLOCO DE COTAS PRD-014 */}
                  {selectedGift.permite_cotas && (
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Presente em Cotas</span>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '20px' }}>
                          COLETIVO
                        </span>
                      </div>

                      {quotaProgress && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>
                            <span>{quotaProgress.cotas_compradas} de {quotaProgress.total_cotas} cotas compradas</span>
                            <span>{Math.round(((quotaProgress.cotas_compradas) / quotaProgress.total_cotas) * 100)}%</span>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${Math.min(100, ((quotaProgress.cotas_compradas) / quotaProgress.total_cotas) * 100)}%`, 
                              background: config?.accent_color || '#C5A059',
                              borderRadius: '10px',
                              transition: 'width 0.3s ease' 
                            }}></div>
                          </div>
                          {quotaProgress.cotas_bloqueadas > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '4px', fontStyle: 'italic' }}>
                              🔒 {quotaProgress.cotas_bloqueadas} cota(s) reservada(s) temporariamente por outros
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', fontWeight: 500 }}>Quantas cotas deseja dar?</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px' }}>
                            <button 
                              type="button"
                              onClick={() => setSelectedQuotas(prev => Math.max(1, prev - 1))}
                              style={{ width: '32px', height: '32px', border: 'none', background: '#f1f5f9', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedQuotas}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const maxAvail = quotaProgress ? quotaProgress.disponivel : (Number(selectedGift.total_cotas) || 99);
                                setSelectedQuotas(prev => Math.min(maxAvail > 0 ? maxAvail : 99, prev + 1));
                              }}
                              style={{ width: '32px', height: '32px', border: 'none', background: '#f1f5f9', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Parcial</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                              {((Number(selectedGift.preco) / (Number(selectedGift.total_cotas) || 1)) * selectedQuotas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleReserveQuotaAndCheckout}
                        disabled={isReservingQuotaLock || (quotaProgress ? quotaProgress.disponivel <= 0 : false)}
                        style={{
                          marginTop: '16px',
                          width: '100%',
                          padding: '14px',
                          borderRadius: '30px',
                          background: (quotaProgress && quotaProgress.disponivel <= 0) ? '#cbd5e1' : '#1E293B',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: (quotaProgress && quotaProgress.disponivel <= 0) ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        {isReservingQuotaLock ? 'Processando...' : (quotaProgress && quotaProgress.disponivel <= 0 ? 'Cotas Esgotadas' : 'Reservar Cota e Gerar PIX ⚡')}
                      </button>
                    </div>
                  )}

                  {/* CTA #1: Fast Checkout PIX (Aceleração de Funil) */}
                  <button 
                    onClick={() => !isFullPurchaseDisabled && handleDirectPix(selectedGift)}
                    className={styles.modalBtnCart}
                    style={{ 
                      backgroundColor: isFullPurchaseDisabled ? '#e2e8f0' : '#1E293B',
                      color: isFullPurchaseDisabled ? '#94a3b8' : '#FFF',
                      fontWeight: 700,
                      border: isFullPurchaseDisabled ? '2px solid #cbd5e1' : '2px solid #1E293B',
                      cursor: isFullPurchaseDisabled ? 'not-allowed' : 'pointer',
                      opacity: isFullPurchaseDisabled ? 0.6 : 1,
                      width: '100%'
                    }}
                    disabled={isFullPurchaseDisabled}
                  >
                    ⚡ Presentear via PIX Agora (Valor Integral)
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                    <button 
                      onClick={() => {
                        if (!isFullPurchaseDisabled) {
                          toggleToCart(selectedGift);
                          setSelectedGift(null);
                        }
                      }}
                      className={styles.modalBtnCart}
                      style={{ 
                        backgroundColor: isFullPurchaseDisabled ? '#e2e8f0' : (cart.some(p => p.id === selectedGift.id) ? '#333' : (config?.accent_color || '#C5A059')),
                        color: isFullPurchaseDisabled ? '#94a3b8' : '#FFF',
                        cursor: isFullPurchaseDisabled ? 'not-allowed' : 'pointer',
                        opacity: isFullPurchaseDisabled ? 0.6 : 1,
                        width: '100%'
                      }}
                      disabled={isFullPurchaseDisabled}
                    >
                      {cart.some(p => p.id === selectedGift.id) ? 'Remover ✓' : 'Adicionar à Cesta'}
                    </button>
                    
                    {(!isFullPurchaseDisabled && selectedGift.link_externo) && (
                      <button 
                        onClick={() => handleAffiliateClick(selectedGift)}
                        className={styles.modalBtnExternal}
                        style={{ 
                          color: config?.accent_color || '#C5A059',
                          borderColor: config?.accent_color || '#C5A059',
                          background: 'transparent',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Comprar Online
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modal}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              style={{ gridTemplateColumns: '1fr' }}
            >
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
              
              <div style={{ padding: '48px', maxHeight: '85vh', overflowY: 'auto' }}>
                {step === 'checkout' ? (
                  <>
                    <h2 style={{ fontFamily: config?.font_serif, marginBottom: '1.5rem', fontSize: '32px' }}>Sua Cesta de Carinho</h2>
                    
                    <div className={styles.cartSummary}>
                      {isQuotaFlow && quotaSelectedGift ? (
                        <div className={styles.cartItem}>
                          <span>Cota de {quotaSelectedGift.nome} ({selectedQuotas}x)</span>
                          <span>{totalCartValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.id} className={styles.cartItem}>
                            <span>{item.nome}</span>
                            <span>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        ))
                      )}
                      <div className={styles.cartTotalLine} style={{ color: config?.accent_color }}>
                        <span>Total</span>
                        <span>{totalCartValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>

                    <div className={styles.messageField}>
                      <label htmlFor="specialMessage" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Uma mensagem especial para nós:</label>
                      <textarea 
                        id="specialMessage"
                        className={styles.messageArea}
                        placeholder="Escreva algo carinhoso aqui... (opcional)"
                        value={specialMessage}
                        onChange={(e) => setSpecialMessage(e.target.value)}
                      />
                    </div>

                    <PaymentSelector 
                      total={totalCartValue}
                      pixPayload={pixPayload}
                      onPixCopy={() => copyToClipboard(pixPayload)}
                      pixCopyStatus={pixCopyStatus}
                      accentColor={config?.accent_color}
                      allowStripe={config?.allow_stripe}
                    />

                    <div className={styles.uploadSection}>
                      {isPreview ? (
                        <button 
                          className={styles.uploadBtn} 
                          onClick={() => handleUploadSuccess({ info: { secure_url: 'fake_preview_url' } })}
                          style={{ backgroundColor: config?.accent_color || '#C5A059' }}
                        >
                          Simular Envio de Comprovante (Modo Preview)
                        </button>
                      ) : (
                        <CldUploadWidget uploadPreset="invite_preset" onSuccess={handleUploadSuccess}>
                          {({ open }) => (
                            <button 
                              className={styles.uploadBtn} 
                              onClick={() => open()}
                              style={{ backgroundColor: config?.accent_color || '#C5A059' }}
                            >
                              Enviar Comprovante de Pagamento
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                      <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#888', textAlign: 'center' }}>
                        {isPreview ? 'Em modo preview, esta ação não fará nada no banco de dados.' : 'Após realizar o pagamento, anexe o comprovante para confirmarmos sua reserva.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className={styles.successMessage}>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      style={{ marginBottom: '2rem' }}
                    >
                      <svg viewBox="0 0 24 24" width="100" height="100" fill={config?.accent_color || '#D4AF37'}>
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                      </svg>
                    </motion.div>
                    <h2 style={{ fontFamily: config?.font_serif, fontSize: '3rem', color: config?.accent_color || '#C5A059', marginBottom: '1rem' }}>Uau! Muito Obrigado!</h2>
                    <p style={{ fontSize: '1.2rem', lineHeight: '1.6', margin: '1.5rem 0', color: '#555' }}>
                      Seu carinho aqueceu nossos corações. Cada presente nos ajuda a construir nossa história e nosso novo lar.
                    </p>
                    <button 
                      className={styles.giftBtn} 
                      onClick={() => { setShowModal(false); setCart([]); setIsQuotaFlow(false); setQuotaSelectedGift(null); }}
                      style={{ backgroundColor: config?.accent_color || '#C5A059', maxWidth: '250px', margin: '0 auto', borderRadius: '30px' }}
                    >
                      Voltar e Continuar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Overlay Intersticial para Redirecionamento Exótico e Trava de 3h (PRD-12B) */}
      <AnimatePresence>
        {isRedirecting && redirectGift && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(15px)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}
            >
              {linkValidationFailed ? (
                // TELA DE CONTINGÊNCIA: LINK QUEBRADO DETECTADO EM FLIGHT (PRD-12C)
                <>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'rgba(197, 160, 89, 0.1)', 
                    borderRadius: '24px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    color: '#C5A059'
                  }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>

                  <h2 style={{ 
                    fontFamily: config?.font_serif || 'inherit',
                    color: '#1c1a17',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    margin: 0 
                  }}>
                    Ajuste de Rota Inteligente
                  </h2>
                  
                  <p style={{ 
                    color: '#8c8375', 
                    fontSize: '1rem', 
                    lineHeight: '1.7', 
                    margin: 0, 
                    background: '#FCFBF9', 
                    padding: '24px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(197, 160, 89, 0.2)' 
                  }}>
                    Detectamos que o link deste parceiro está temporariamente indisponível. 
                    O alerta automático do portal foi acionado e o link será restaurado o quanto antes. 
                    Enquanto realizamos o ajuste técnico, você pode presentear com 1-clique via PIX de forma 100% segura.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        const target = redirectGift;
                        setIsRedirecting(false);
                        setRedirectGift(null);
                        handleDirectPix(target);
                      }}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: '#1c1a17',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '40px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ⚡ Presentear via PIX Agora
                    </button>

                    <button 
                      onClick={() => {
                        setIsRedirecting(false);
                        setRedirectGift(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        color: '#64748B',
                        border: 'none',
                        textDecoration: 'underline',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Voltar para a Lista
                    </button>
                  </div>
                </>
              ) : (
                // FLUXO PADRÃO DE REDIRECIONAMENTO E RESERVA (PRD-12B)
                <>
                  <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '3px solid #e2e8f0',
                      borderTopColor: config?.accent_color || '#C5A059',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: config?.accent_color || '#C5A059' }}>{redirectCountdown}</span>
                  </div>
                  
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>

                  <h2 style={{ 
                    fontFamily: config?.font_serif || 'inherit',
                    color: '#1e293b',
                    fontSize: '1.75rem',
                    margin: 0 
                  }}>
                    {isValidatingLink ? 'Verificando segurança do link...' : 'Redirecionando para parceiro...'}
                  </h2>
                  
                  <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                    Garantindo sua exclusividade! Estamos **reservando o item &quot;{redirectGift.nome}&quot;** temporariamente por **3 horas** em nosso convite para que ninguém mais compre igual.
                  </p>

                  <div style={{ 
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    color: '#166534',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginTop: '0.5rem'
                  }}>
                    ✅ Trava de 3 Horas Ativada com Sucesso!
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
