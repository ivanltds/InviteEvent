'use client';

import { useState, useEffect } from 'react';
import styles from "./Presentes.module.css";
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';

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
}

export default function PresentesPage() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedItem, setSelectedItem] = useState<Presente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'pix' | 'success'>('pix');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [presentesRes, configRes] = await Promise.all([
        supabase
          .from('presentes')
          .select('*')
          .neq('status', 'pausado')
          .order('preco', { ascending: true }),
        supabase
          .from('configuracoes')
          .select('pix_chave, pix_banco, pix_nome')
          .eq('id', 1)
          .maybeSingle()
      ]);

      if (presentesRes.data) {
        setPresentes(presentesRes.data as Presente[]);
      }
      if (configRes.data) {
        setConfig(configRes.data as Config);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleOpenPix = (item: Presente) => {
    setSelectedItem(item);
    setStep('pix');
    setShowModal(true);
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
        p_convidado_nome: 'Convidado via Site'
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
      ) : (
        <section className={styles.grid}>
          {presentes.map((item) => {
            const isReserved = item.status === 'reservado' || (item.quantidade_reservada >= item.quantidade_total);
            const remaining = item.quantidade_total - item.quantidade_reservada;
            
            return (
              <div key={item.id} className={`${styles.card} ${isReserved ? styles.reserved : ''}`}>
                <div className={styles.imagePlaceholder}>
                  {item.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem_url} alt={item.nome} className={styles.itemImage} />
                  ) : (
                    <span className={styles.categoryIcon}>🎁</span>
                  )}
                </div>
                <div className={styles.info}>
                  {item.quantidade_total > 1 && !isReserved && (
                    <span className={styles.stockInfo}>{remaining} {remaining === 1 ? 'disponível' : 'disponíveis'}</span>
                  )}
                  <h3>{item.nome}</h3>
                  <p className={styles.desc}>{item.descricao}</p>
                  <p className={styles.price}>
                    {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <button 
                    className={styles.giftBtn}
                    disabled={isReserved}
                    onClick={() => handleOpenPix(item)}
                  >
                    {isReserved ? 'Item Esgotado' : 'Presentear'}
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

                <div className={styles.pixCard}>
                  <span className={styles.pixKeyLabel}>Chave PIX (E-mail/CPF/Celular)</span>
                  <div className={styles.pixKey}>{config?.pix_chave || 'financeiro@nossoevento.com'}</div>
                  <span className={styles.pixBank}>{config?.pix_banco || 'Banco Inter'} - {config?.pix_nome || 'Marcus & Layslla'}</span>
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
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>✨</div>
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
