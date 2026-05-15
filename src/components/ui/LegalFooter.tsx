'use client';

import React, { useState } from 'react';

interface LegalFooterProps {
  theme?: 'light' | 'dark';
}

export default function LegalFooter({ theme = 'dark' }: LegalFooterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('privacy');

  const openModal = (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    setModalContent(type);
    setIsModalOpen(true);
  };

  const styles = {
    footer: {
      padding: '40px 20px',
      borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
      backgroundColor: theme === 'dark' ? '#0A0A0A' : '#FAFAFA',
      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '20px',
      fontFamily: 'var(--font-inter), sans-serif'
    },
    logo: {
      fontFamily: 'var(--font-playfair), serif',
      fontSize: '1.5rem',
      color: theme === 'dark' ? '#ffffff' : '#1A1A1A',
      letterSpacing: '0.05em',
      marginBottom: '4px'
    },
    links: {
      display: 'flex',
      gap: '24px',
      fontSize: '0.85rem',
      flexWrap: 'wrap' as const,
      justifyContent: 'center'
    },
    link: {
      color: theme === 'dark' ? '#d1d5db' : '#4b5563',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s'
    },
    copyright: {
      fontSize: '0.75rem',
      opacity: 0.7,
      textAlign: 'center' as const
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    },
    modal: {
      backgroundColor: '#111111',
      color: '#e5e7eb',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    modalHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalBody: {
      padding: '20px',
      overflowY: 'auto' as const,
      fontSize: '0.9rem',
      lineHeight: 1.6,
      color: '#d1d5db'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      fontSize: '1.5rem',
      cursor: 'pointer'
    },
    modalFooter: {
      padding: '12px 20px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'flex-end'
    },
    closeBtnPrimary: {
      backgroundColor: '#374151',
      color: '#ffffff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer'
    }
  };

  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.logo}>InviteEvent</div>
        <div style={styles.links}>
          <a 
            style={styles.link} 
            onClick={(e) => openModal(e, 'terms')}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C5A25C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#4b5563')}
          >
            Termos de Uso
          </a>
          <a 
            style={styles.link} 
            onClick={(e) => openModal(e, 'privacy')}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C5A25C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#4b5563')}
          >
            Privacidade e LGPD
          </a>
        </div>
        <div style={styles.copyright}>
          &copy; {new Date().getFullYear()} InviteEventAI. Todos os direitos reservados.<br />
          Plataforma de automação premium para casamentos.
        </div>
      </footer>

      {/* Legal Modal Component */}
      {isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#C5A25C' }}>
                {modalContent === 'terms' ? 'Termos de Uso — InviteEventAI' : 'Política de Privacidade e LGPD'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              {modalContent === 'terms' ? (
                <div>
                  <h4>1. Objeto</h4>
                  <p>Este termo rege o uso da plataforma InviteEventAI para criação e gestão de convites de casamentos, RSVP digital e intermediação de listas de presentes.</p>
                  <h4>2. Limitação de Responsabilidade</h4>
                  <p>A plataforma funciona estritamente como intermediária tecnológica. Qualquer compra efetuada através de links externos de Lojas Parceiras é de inteira e exclusiva responsabilidade da plataforma de comércio final (Amazon, Magalu, etc).</p>
                  <h4>3. Cancelamento e Reembolso</h4>
                  <p>Em conformidade com a legislação vigente, garantimos o direito de desistência e reembolso integral da taxa de ativação dentro de 7 dias da contratação, desde que antes da data de realização do evento.</p>
                  <h4>4. Conduta</h4>
                  <p>O contratante é inteiramente responsável pelo conteúdo, fotos e textos veiculados no hotsite público do evento.</p>
                </div>
              ) : (
                <div>
                  <h4>1. Coleta de Dados Pessoais</h4>
                  <p>Coletamos dados indispensáveis para a gestão de presenças (Nome e Telefone). Não compartilhamos ou comercializamos informações de convidados.</p>
                  <h4>2. Tratamento de Dados Sensíveis (LGPD)</h4>
                  <p>As restrições alimentares cadastradas no RSVP são dados sensíveis sob a ótica jurídica da saúde. A coleta ocorre sob consentimento explícito e rastreabilidade do IP do dispositivo no momento do registro.</p>
                  <h4>3. Direito ao Esquecimento</h4>
                  <p>Todos os dados de convidados e interações do mural de fotos do evento são expurgados permanentemente da base de dados transacionais 90 dias após o encerramento oficial do evento.</p>
                  <h4>4. Segurança</h4>
                  <p>Implementamos segurança TLS ponta-a-ponta e regras estritas de isolamento de dados (RLS - Row Level Security) para evitar acessos cruzados não autorizados.</p>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.closeBtnPrimary} 
                onClick={() => setIsModalOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
