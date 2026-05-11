'use client';

import { useState, useEffect, useMemo } from 'react';
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

      const [configRes, presentesRes] = await Promise.all([
        supabase
          .from('configuracoes')
          .select('pix_chave, pix_banco, pix_nome, pix_tipo, accent_color, allow_stripe')
          .eq('evento_id', inviteData.evento_id)
          .maybeSingle(),
        supabase
          .from('presentes')
          .select('*')
          .eq('evento_id', inviteData.evento_id)
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
      const response = await giftService.reserveGifts({
        presentesIds: cart.map(p => p.id),
        urlComprovante: proofUrl,
        mensagem: specialMessage,
        conviteId: invite?.id,
        eventoId: invite?.evento_id,
        convidadoNome: invite?.nome_principal || 'Convidado via Site'
      }) as { success: boolean; message: string };

      if (!response.success) {
        console.error(response.message);
        return;
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
      {showIntro && (
        <EmotionalIntro 
          onComplete={() => setShowIntro(false)} 
          accentColor={config?.accent_color}
        />
      )}

      <nav className={styles.headerNav}>
        <Link href={`/inv/${invite?.slug || ''}`} className={styles.backLink}>
          InviteEvent
        </Link>
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
                  onClick={() => !isReserved && setSelectedGift(item)}
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
                      <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#888', textAlign: 'center' }}>
                        Após realizar o pagamento, anexe o comprovante para confirmarmos sua reserva.
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
