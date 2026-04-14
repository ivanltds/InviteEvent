'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from "./Presentes.module.css";
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { Convite } from '@/lib/types/database';
import { generatePixPayload } from '@/lib/utils/pix';
import { celebrateGiftSuccess, shootHearts } from '@/lib/utils/confetti';

interface Presente {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  imagem_url: string;
  status: 'disponivel' | 'reservado' | 'pausado';
  quantidade_total: number;
  quantidade_reservada: number;
}

interface Config {
  pix_chave: string;
  pix_banco: string;
  pix_nome: string;
  pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  accent_color?: string;
}

const INTRO_MESSAGES = [
  { title: "Nosso Novo Lar", text: "Cada item aqui é um tijolo no nosso sonho que você torna realidade." },
  { title: "Sua Presença é Tudo", text: "Sua amizade é nosso maior presente, mas se quiser nos ajudar a construir nossa história..." },
  { title: "Um Toque de Carinho", text: "Preparamos esta lista para que você sinta que faz parte de cada cantinho da nossa casa." },
  { title: "Gratidão", text: "Obrigado por caminhar conosco nesta jornada incrível!" }
];

export default function PresentesPage() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [cart, setCart] = useState<Presente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<Convite | null>(null);
  const [pixCopyStatus, setPixCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [specialMessage, setSpecialMessage] = useState('');

  const randomIntro = useMemo(() => {
    return INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)];
  }, []);

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
          .select('pix_chave, pix_banco, pix_nome, pix_tipo, accent_color')
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
      const { data, error } = await supabase.rpc('reservar_multiplos_presentes_v1', {
        p_presente_ids: cart.map(p => p.id),
        p_url_comprovante: proofUrl,
        p_mensagem: specialMessage,
        p_convite_id: invite?.id || null,
        p_convidado_nome: invite?.nome_principal || 'Convidado via Site'
      });

      if (error) throw error;

      const response = data as { success: boolean; message: string };
      if (!response.success) {
        alert(response.message);
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
      
      // CELEBRAÇÃO WOW!
      const themeColor = config?.accent_color || '#B2AC88';
      celebrateGiftSuccess({ colors: [themeColor, '#ffffff', '#8FA89B'] });
      setTimeout(() => shootHearts([themeColor, '#ff69b4']), 500);
      setTimeout(() => shootHearts([themeColor, '#ff0000']), 1500);

    } catch (error: any) {
      console.error('Erro ao processar presentes:', error);
      alert('Erro ao processar sua lista. Tente novamente.');
    }
  };

  const pixPayload = useMemo(() => {
    if (!config || totalCartValue === 0) return '';
    return generatePixPayload(
      config.pix_chave,
      config.pix_nome || 'CASAMENTO',
      config.pix_tipo || 'cpf',
      'SAO PAULO',
      totalCartValue
    );
  }, [config, totalCartValue]);

  return (
    <main className={styles.main}>
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className={styles.introOverlay}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className={styles.introContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h2 className="cursive">{randomIntro.title}</h2>
              <p>{randomIntro.text}</p>
              <button className={styles.giftBtn} onClick={() => setShowIntro(false)}>
                Entrar na Lista
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={styles.header}>
        <h1 className="cursive">Nossa Lista de Presentes</h1>
        <p>Cada item aqui foi escolhido com carinho para nossa nova vida juntos.</p>
      </header>

      {loading ? (
        <p className={styles.loading}>Preparando lista...</p>
      ) : isInvited === false ? (
        <div className={styles.restricted}>
           <h2>Acesso Reservado</h2>
           <p>Por favor, use o link enviado no seu convite.</p>
        </div>
      ) : (
        <>
          <section className={styles.grid}>
            {presentes.map((item) => {
              const isSelected = cart.some(p => p.id === item.id);
              const isSoldOut = item.quantidade_reservada >= item.quantidade_total;
              const isDisabled = isSoldOut || item.status === 'pausado';
              
              return (
                <motion.div 
                  key={item.id} 
                  layout
                  className={`${styles.card} ${isDisabled ? styles.reserved : ''} ${isSelected ? styles.cardSelected : ''}`}
                >
                  <div className={styles.imagePlaceholder}>
                    {isSelected && <span className={styles.selectedBadge}>Selecionado</span>}
                    {item.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imagem_url} alt={item.nome} className={styles.itemImage} />
                    ) : (
                       <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none"><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path><rect x="2" y="7" width="20" height="5"></rect><polyline points="20 12 20 22 4 22 4 12"></polyline></svg>
                    )}
                  </div>
                  <div className={styles.info}>
                    <h3>{item.nome}</h3>
                    <p className={styles.price}>
                      {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <button 
                      className={styles.giftBtn}
                      style={isSelected ? { backgroundColor: 'var(--text-main-safe)', color: 'white' } : {}}
                      disabled={isDisabled}
                      onClick={() => toggleToCart(item)}
                    >
                      {isDisabled ? 'Esgotado' : isSelected ? 'Remover' : 'Adicionar à Lista'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </section>

          {cart.length > 0 && (
            <motion.button 
              className={styles.cartFloatingBtn}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={handleOpenCheckout}
            >
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span className={styles.cartBadge}>{cart.length}</span>
            </motion.button>
          )}
        </>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <motion.div 
            className={styles.modal}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            
            {step === 'checkout' ? (
              <>
                <h2>Sua Cesta de Presentes</h2>
                
                <div className={styles.cartSummary}>
                  {cart.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <span>{item.nome}</span>
                      <span>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  ))}
                  <div className={styles.cartTotalLine}>
                    <span>Total</span>
                    <span>{totalCartValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>

                <div className={styles.messageField}>
                  <label htmlFor="specialMessage">Sua mensagem especial para os noivos:</label>
                  <textarea 
                    id="specialMessage"
                    className={styles.messageArea}
                    placeholder="Escreva algo carinhoso aqui..."
                    value={specialMessage}
                    onChange={(e) => setSpecialMessage(e.target.value)}
                  />
                </div>

                <div className={styles.pixContainer}>
                  <div className={styles.qrCodeContainer}>
                    {pixPayload && (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`} 
                        alt="QR Code" 
                        className={styles.qrCode}
                      />
                    )}
                    <button className={styles.copyCodeBtn} onClick={() => copyToClipboard(pixPayload)}>
                      {pixCopyStatus === 'copied' ? 'Copiado!' : 'Copiar Código PIX'}
                    </button>
                  </div>
                </div>

                <div className={styles.uploadSection}>
                  <CldUploadWidget uploadPreset="invite_preset" onSuccess={handleUploadSuccess}>
                    {({ open }) => (
                      <button className={styles.uploadBtn} onClick={() => open()}>
                        Enviar Comprovante Único
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </>
            ) : (
              <div className={styles.successMessage}>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <svg viewBox="0 0 24 24" width="100" height="100" fill="var(--accent)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </motion.div>
                <h2 className="cursive" style={{ fontSize: '3rem' }}>Uau! Muito Obrigado!</h2>
                <p>Seu carinho aqueceu nossos corações. Cada presente nos ajuda a construir nossa história.</p>
                <button className={styles.giftBtn} onClick={() => { setShowModal(false); setCart([]); }}>
                  Voltar e Continuar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
