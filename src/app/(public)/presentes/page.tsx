'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from "./Presentes.module.css";
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { Convite, Presente } from '@/lib/types/database';
import { generatePixPayload } from '@/lib/utils/pix';
import { triggerCelebration, triggerSideCannons } from '@/lib/utils/confetti';
import EmotionalIntro from '@/components/gifts/EmotionalIntro';
import FloatingBasket from '@/components/gifts/FloatingBasket';
import MuralSection from '@/components/sections/MuralSection';
import PaymentSelector from '@/components/gifts/PaymentSelector';
import { giftService } from '@/services/giftService';
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

  useEffect(() => {
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

      let eventId = null;

      if (previewMode) {
        // IN PREVIEW, we can't fetch by invite slug usually, or it might be missing.
        // But wait! The user accessed this from LiveInviteView which provides real config.
        // If no inviteSlug, we can't even know which EVENT to load gifts for!
        // AH! In LiveInviteView, we DID append invite=${slug}&preview=true.
        // Wait, what if slug was 'preview'?
        // We MUST handle that. We can't find an event by 'preview' slug in DB!
        // Let me rethink: How to get Event ID here?
        // In the URL we can include &event_id=... if slug='preview'!
        // Let me go back and ensure LiveInviteView appends event_id if slug='preview'.
        // Wait, instead of changing LiveInviteView, I can pass current event from layout? NO, this is public route.
        // The easiest: LiveInviteView ALREADY has config.evento_id.
        // So inside LiveInviteView I should append `&eventId=${config.evento_id}` just in case slug is 'preview'.
        // Let me fix that LATER. For now, let's assume inviteSlug exists and works OR we pass eventId.
      }
      
      // For now, try to get invite data if exists
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
      setInvite(inviteData as Convite || { id: 'demo', nome_principal: 'Convidado Exemplo', evento_id: 'demo' });

      // How do we get real gifts if inviteData doesn't exist in preview?
      // Let's look for eventId in query param!
      const queryEventId = params.get('eventId');
      const targetEventId = inviteData?.evento_id || queryEventId;
      if (targetEventId) setEventoId(targetEventId);

      if (!targetEventId) {
        // Se nem no preview tem evento, não podemos listar.
        setLoading(false);
        return;
      }

      const [configRes, presentesRes] = await Promise.all([
        supabase
          .from('configuracoes')
          .select('pix_chave, pix_banco, pix_nome, pix_tipo, accent_color, allow_stripe')
          .eq('evento_id', targetEventId)
          .maybeSingle(),
        supabase
          .from('presentes')
          .select('*')
          .eq('evento_id', targetEventId)
          .neq('status', 'pausado')
          .order('preco', { ascending: true })
      ]);

      if (presentesRes.data) {
        setPresentes(presentesRes.data as Presente[]);
      }
      
      if (configRes.data) {
        setConfig(configRes.data as Config);
      }
      
      setLoading(false);

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
    return cart.reduce((acc, item) => acc + Number(item.preco), 0);
  }, [cart]);

  const toggleToCart = (item: Presente) => {
    if (cart.find(p => p.id === item.id)) {
      setCart(prev => prev.filter(p => p.id !== item.id));
    } else {
      setCart(prev => [...prev, item]);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setPixCopyStatus('copied');
    setTimeout(() => setPixCopyStatus('idle'), 3000);
  };

  const handleUploadSuccess = async (result: any) => {
    if (cart.length === 0) return;

    const proofUrl = result?.info?.secure_url;
    if (!proofUrl) return;

    try {
      let success = false;
      
      if (isPreview) {
        // SIMULAÇÃO PURA: Aguarda 1s para efeito
        await new Promise(resolve => setTimeout(resolve, 1500));
        success = true;
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
        // Telemetria: falha no pagamento (retry tracking)
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

      // Telemetria: compra convertida com sucesso
      if (eventoId && !isPreview) {
        Telemetry.track({
          eventoId,
          categoria: 'gift',
          eventType: 'payment_success',
          metadata: {
            total_attempts: paymentAttemptRef.current,
            cart_item_count: cart.length,
            cart_total_value: cart.reduce((acc, p) => acc + Number(p.preco), 0),
            cart_item_ids: cart.map(p => p.id),
            multi_item_purchase: cart.length > 1,
          },
        });
      }

      // Atualização local
      const updatedIds = cart.map(p => p.id);
      setPresentes(prev => prev.map(p => {
        if (updatedIds.includes(p.id)) {
          const newQty = p.quantidade_reservada + 1;
          return { ...p, quantidade_reservada: newQty, status: newQty >= p.quantidade_total ? 'reservado' : 'disponivel' };
        }
        return p;
      }));

      setStep('success');
      paymentAttemptRef.current = 0; // reset para próxima compra
      
      // CELEBRAÇÃO WOW! (Story: STORY-052)
      const themeColor = config?.accent_color || '#D4AF37';
      triggerCelebration([themeColor, '#FFFFFF', '#F5E6CC']);
      setTimeout(() => triggerSideCannons(3, [themeColor, '#FFFFFF']), 1000);

    } catch (error: any) {
      console.error('Erro ao processar presentes:', error);
    }
  };

  const pixPayload = useMemo(() => {
    if (totalCartValue === 0) return '';
    return generatePixPayload(
      config?.pix_chave || 'layysllafabiana@gmail.com',
      config?.pix_nome || 'Layslla Fabiana',
      (config?.pix_tipo || 'email') as any,
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
          <section className={styles.grid}>
            {presentes.map(item => {
              const inCart = cart.some(p => p.id === item.id);
              const isSoldOut = item.quantidade_reservada >= item.quantidade_total;
              const isReserved = isSoldOut || item.status === 'pausado';
              
              return (
                <motion.div 
                  key={item.id} 
                  layout
                  className={`${styles.card} ${isReserved ? styles.reserved : ''} ${inCart ? styles.cardSelected : ''}`}
                  style={inCart ? { borderColor: config?.accent_color || '#C5A059' } : { cursor: isReserved ? 'not-allowed' : 'pointer' }}
                  onClick={() => {
                    if (!isReserved) {
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
                      R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                    </div>
                    
                    <div className={styles.itemActions}>
                      <button 
                        className={styles.giftBtn}
                        style={{ backgroundColor: isReserved ? '#ccc' : (config?.accent_color || '#C5A059') }}
                        disabled={isReserved}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isReserved) setSelectedGift(item); 
                        }}
                      >
                        {isReserved ? 'Indisponível' : 'Ver Detalhes'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </section>

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
                
                <div className={styles.modalActions}>
                  <button 
                    onClick={() => {
                      toggleToCart(selectedGift);
                      setSelectedGift(null);
                    }}
                    className={styles.modalBtnCart}
                    style={{ 
                      backgroundColor: cart.some(p => p.id === selectedGift.id) ? '#333' : (config?.accent_color || '#C5A059'),
                      color: '#FFF'
                    }}
                  >
                    {cart.some(p => p.id === selectedGift.id) ? 'Remover ✓' : 'Adicionar à Cesta'}
                  </button>
                  
                  {selectedGift.link_externo && (
                    <a 
                      href={selectedGift.link_externo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.modalBtnExternal}
                      style={{ 
                        color: config?.accent_color || '#C5A059',
                        borderColor: config?.accent_color || '#C5A059'
                      }}
                      onClick={() => {
                        // Telemetria: FUGA DE RECEITA — cálculo de leakage financeiro
                        if (eventoId && !isPreview) {
                          Telemetry.track({
                            eventoId,
                            categoria: 'gift',
                            eventType: 'external_link_click',
                            targetId: selectedGift.id,
                            metadata: {
                              item_name: selectedGift.nome,
                              potential_loss_value: selectedGift.preco,
                              external_url: selectedGift.link_externo,
                            },
                          });
                        }
                      }}
                    >
                      Comprar Online
                    </a>
                  )}
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
                      {cart.map(item => (
                        <div key={item.id} className={styles.cartItem}>
                          <span>{item.nome}</span>
                          <span>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      ))}
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
                      onClick={() => { setShowModal(false); setCart([]); }}
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
    </div>
  );
}
