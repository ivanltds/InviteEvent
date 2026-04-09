'use client';

import { useState, useEffect } from 'react';
import styles from "./Presentes.module.css";
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import Link from 'next/link';
import { Convite } from '@/lib/types/database';
import { generatePixPayload } from '@/lib/utils/pix';

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
}

export default function PresentesPage() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedItem, setSelectedItem] = useState<Presente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'pix' | 'success'>('pix');
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<Convite | null>(null);
  const [pixCopyStatus, setPixCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Validar convite se houver slug na URL
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

      // 2. Buscar configurações do casamento
      let configData: Config | null = null;
      
      // Tentar busca direta (ID 1 ou primeiro registro)
      const { data: directConfig, error: configError } = await supabase
        .from('configuracoes')
        .select('pix_chave, pix_banco, pix_nome, pix_tipo')
        .limit(1)
        .maybeSingle();

      if (configError) {
        console.warn('Erro ao buscar config, tentando fallback:', configError);
      }

      if (directConfig) {
        configData = directConfig as Config;
      } else {
        // Fallback emergencial: Se o RLS bloquear, tentamos usar o ID 1 explicitamente via RPC no futuro
        // Por enquanto, apenas avisamos e deixamos o estado carregar para não travar a tela
        console.warn('RLS pode estar bloqueando a leitura da configuração.');
      }

      const [presentesRes] = await Promise.all([
        supabase
          .from('presentes')
          .select('*')
          .neq('status', 'pausado')
          .order('preco', { ascending: true })
      ]);

      if (presentesRes.data) {
        setPresentes(presentesRes.data as Presente[]);
      }
      
      if (configData) {
        setConfig(configData);
      } else {
        console.error('Nenhuma configuração encontrada no banco de dados.');
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleOpenPix = (item: Presente) => {
    setSelectedItem(item);
    setStep('pix');
    setShowModal(true);
    setPixCopyStatus('idle');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setPixCopyStatus('copied');
    setTimeout(() => setPixCopyStatus('idle'), 3000);
  };

  const handleUploadSuccess = async (result: any) => {
    if (!selectedItem) return;

    const proofUrl = result?.info?.secure_url;
    if (!proofUrl) return;

    try {
      // Chamada atômica via RPC (Database Function)
      const { data, error } = await supabase.rpc('reservar_presente_v1', {
        p_presente_id: selectedItem.id,
        p_url_comprovante: proofUrl,
        p_convite_id: invite?.id || null,
        p_convidado_nome: invite?.nome_principal || 'Convidado via Site'
      });

      if (error) throw error;

      const response = data as { success: boolean; message: string };

      if (!response.success) {
        alert(response.message);
        return;
      }

      // 2. Atualizar estado local para refletir a mudança
      const newQty = (selectedItem.quantidade_reservada || 0) + 1;
      const isFull = newQty >= selectedItem.quantidade_total;

      setPresentes(prev => prev.map(p => 
        p.id === selectedItem.id 
          ? { ...p, quantidade_reservada: newQty, status: isFull ? 'reservado' : 'disponivel' } 
          : p
      ));
      
      setStep('success');
    } catch (error: any) {
      console.error('Erro ao processar presente:', error);
      alert('Houve um erro ao processar seu presente. Por favor, tente novamente ou entre em contato conosco.');
    }
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className="cursive">Nossa Lista de Presentes</h1>
        <p>Preparamos uma lista de itens que nos ajudarão a montar nosso novo lar. Sua presença é nosso maior presente, mas se desejar nos presentear, aqui estão algumas sugestões.</p>
      </header>

      {loading ? (
        <p className={styles.loading}>Carregando presentes...</p>
      ) : isInvited === false ? (
        <div className={styles.restricted}>
          <div className={styles.lockIcon}>
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2>Acesso Restrito</h2>
          <p>Para visualizar a lista de presentes, por favor utilize o link individual enviado pelos noivos no seu convite.</p>
          <Link href="/" className={styles.giftBtn} style={{ marginTop: '2rem', display: 'inline-block' }}>
            Voltar ao Início
          </Link>
        </div>
      ) : (
        <section className={styles.grid}>
          {presentes.map((item) => {
            const isSoldOut = item.quantidade_reservada >= item.quantidade_total;
            const isPaused = item.status === 'pausado';
            const isDisabled = isSoldOut || isPaused;
            const remaining = item.quantidade_total - item.quantidade_reservada;
            
            return (
              <div key={item.id} className={`${styles.card} ${isDisabled ? styles.reserved : ''}`}>
                <div className={styles.imagePlaceholder}>
                  {item.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem_url} alt={item.nome} className={styles.itemImage} />
                  ) : (
                    <span className={styles.categoryIcon}>
                      <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                    </span>
                  )}
                </div>
                <div className={styles.info}>
                  {item.quantidade_total > 1 && !isDisabled && (
                    <span className={styles.stockInfo}>{remaining} {remaining === 1 ? 'disponível' : 'disponíveis'}</span>
                  )}
                  <h3>{item.nome}</h3>
                  <p className={styles.desc}>{item.descricao}</p>
                  <p className={styles.price}>
                    {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <button 
                    className={styles.giftBtn}
                    disabled={isDisabled}
                    onClick={() => handleOpenPix(item)}
                  >
                    {isPaused ? 'Indisponível' : isSoldOut ? 'Item Esgotado' : 'Presentear'}
                  </button>
                </div>
              </div>
            );
          })}
          {presentes.length === 0 && !loading && (
            <p className={styles.empty}>A lista de presentes está sendo preparada. Volte em breve!</p>
          )}
        </section>
      )}

      {showModal && selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            
            {step === 'pix' ? (
              <>
                <h2>Quase lá!</h2>
                <p className={styles.pixInstructions}>
                  Para presentear com <strong>{selectedItem.nome}</strong>, faça um PIX no valor de 
                  <strong> {Number(selectedItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> usando os dados abaixo:
                </p>

                <div className={styles.pixContainer}>
                  <div className={styles.qrCodeContainer}>
                    {config?.pix_chave && (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          generatePixPayload(
                            config.pix_chave,
                            config.pix_nome || 'CASAMENTO',
                            config.pix_tipo || 'cpf',
                            'SAO PAULO',
                            Number(selectedItem.preco)
                          )
                        )}`} 
                        alt="QR Code PIX" 
                        className={styles.qrCode}
                      />
                    )}
                    <button 
                      className={styles.copyCodeBtn}
                      onClick={() => copyToClipboard(
                        generatePixPayload(
                          config?.pix_chave || '',
                          config?.pix_nome || 'CASAMENTO',
                          config?.pix_tipo || 'cpf',
                          'SAO PAULO',
                          Number(selectedItem.preco)
                        )
                      )}
                    >
                      {pixCopyStatus === 'copied' ? 'Copiado!' : 'Copiar Código PIX (Copia e Cola)'}
                    </button>
                  </div>

                  <div className={styles.pixDetails}>
                    <div className={styles.pixCard}>
                      <span className={styles.pixKeyLabel}>Chave PIX</span>
                      <div className={styles.pixKeyRow}>
                        <div className={styles.pixKey}>{config?.pix_chave || 'Chave não cadastrada'}</div>
                        {config?.pix_chave && (
                          <button 
                            className={styles.miniCopyBtn}
                            onClick={() => copyToClipboard(config.pix_chave)}
                            title="Copiar Chave"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                        )}
                      </div>
                      <span className={styles.pixBank}>
                        {config?.pix_banco || 'Banco não informado'} - {config?.pix_nome || 'Beneficiário não informado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.uploadSection}>
                  <p className={styles.uploadLabel}>Já fez o PIX? Envie o comprovante abaixo:</p>
                  <CldUploadWidget 
                    uploadPreset="invite_preset"
                    onSuccess={handleUploadSuccess}
                  >
                    {({ open }) => (
                      <button className={styles.uploadBtn} onClick={() => open()}>
                        Enviar Comprovante
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </>
            ) : (
              <div className={styles.successMessage}>
                <div style={{marginBottom: '1rem'}}>
                  <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" strokeWidth="1" fill="none" style={{color: 'var(--accent)'}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
                <h3>Muito Obrigado!</h3>
                <p>Recebemos sua intenção de presente. Seu carinho torna nosso dia ainda mais especial!</p>
                <button className={styles.giftBtn} style={{marginTop: '2rem'}} onClick={() => setShowModal(false)}>
                  Voltar à Lista
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
