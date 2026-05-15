'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface CookieBannerProps {
  delay?: number; // Atraso padrão configurável
  theme?: 'light' | 'dark';
}

export default function CookieBanner({ delay = 1000, theme = 'dark' }: CookieBannerProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('privacy');

  useEffect(() => {
    // Checar consentimento prévio no localStorage
    const storedConsent = localStorage.getItem('invite-event-cookie-consent');
    if (storedConsent === 'accepted') {
      return; // Já aceitou, não exibe nada
    }

    // STORY-013 UI constraint: Se for página de convite (/inv/slug), 
    // espera concluir todas as animações iniciais do envelope (5 segundos).
    const isInvitationPage = pathname?.startsWith('/inv/');
    const activeDelay = isInvitationPage ? 5000 : delay;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, activeDelay);

    return () => clearTimeout(timer);
  }, [delay, pathname]);

  const handleAccept = () => {
    localStorage.setItem('invite-event-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const openModal = (type: 'terms' | 'privacy') => {
    setModalContent(type);
    setIsModalOpen(true);
  };

  if (!isVisible && !isModalOpen) return null;

  const styles = {
    banner: {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      left: '20px',
      maxWidth: '450px',
      backgroundColor: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      zIndex: 9999,
      display: isVisible ? 'flex' : 'none',
      flexDirection: 'column' as const,
      gap: '12px',
      fontFamily: 'inherit',
      animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    title: {
      fontSize: '0.95rem',
      fontWeight: 600,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    text: {
      fontSize: '0.8rem',
      lineHeight: 1.5,
      margin: 0,
      opacity: 0.85
    },
    link: {
      color: '#C5A25C', // Dourado sutil do design system
      textDecoration: 'underline',
      background: 'none',
      border: 'none',
      padding: 0,
      font: 'inherit',
      cursor: 'pointer'
    },
    btnGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
      marginTop: '4px'
    },
    acceptBtn: {
      backgroundColor: '#C5A25C',
      color: '#ffffff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* Floating Widget */}
      {isVisible && (
        <div style={styles.banner} id="cookie-banner">
          <h4 style={styles.title}>
            🍪 Controle de Privacidade
          </h4>
          <p style={styles.text}>
            Utilizamos cookies essenciais para melhorar sua experiência, garantir a segurança do site e viabilizar funcionalidades como a confirmação de RSVP e reserva de presentes. Ao continuar navegando, você concorda com nossa {' '}
            <button style={styles.link} onClick={() => openModal('privacy')}>Política de Privacidade</button> e nossos {' '}
            <button style={styles.link} onClick={() => openModal('terms')}>Termos de Uso</button>.
          </p>
          <div style={styles.btnGroup}>
            <button 
              style={styles.acceptBtn} 
              onClick={handleAccept}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a9874b')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#C5A25C')}
            >
              Aceitar e Continuar
            </button>
          </div>
        </div>
      )}

      {/* Overlay Legal modal */}
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
                  <p>Este termo rege o uso da plataforma InviteEventAI para criação e gestão de convites de casamentos, RSVP digital e intermediação fictícia/facilitada de listas de presentes.</p>
                  <h4>2. Limitação de Responsabilidade</h4>
                  <p>A plataforma funciona estritamente como intermediária de informações. Qualquer compra efetuada através de links externos recomendados (Lojas Afiliadas como Amazon, Magalu, etc) é de inteira e exclusiva responsabilidade da plataforma final. Não processamos transações financeiras de lojas de terceiros e não somos responsáveis pela entrega de itens físicos comprados fora de nossa plataforma.</p>
                  <h4>3. Cancelamento e Reembolso</h4>
                  <p>Por se tratar de licenciamento SaaS para eventos únicos, garantimos o direito de arrependimento e reembolso integral dentro dos primeiros 7 dias após o pagamento de ativação, contanto que o evento ainda não tenha ocorrido.</p>
                  <h4>4. Conduta</h4>
                  <p>O usuário organizador é inteiramente responsável pelas imagens, textos e mídias veiculadas no mural de fotos e detalhes de seu casamento digital.</p>
                </div>
              ) : (
                <div>
                  <h4>1. Coleta de Dados Pessoais</h4>
                  <p>Coletamos dados estritamente necessários fornecidos pelos convidados para processamento da presença (Nome, Telefone, Presença). Nenhum dado sensível além das restrições alimentares é processado por nossa equipe.</p>
                  <h4>2. Tratamento de Dados Sensíveis (LGPD)</h4>
                  <p>Informações de restrições alimentares são consideradas dados de saúde no escopo da LGPD. Ao informá-las no formulário de RSVP, coletamos seu consentimento ativo e IP. Estes dados serão compartilhados exclusivamente com os noivos e seus fornecedores de buffet para personalização do cardápio e prevenção de emergências médicas.</p>
                  <h4>3. Exclusão dos Dados (Direito ao Esquecimento)</h4>
                  <p>Todos os dados inseridos por convidados serão limpos ou anonimizados em até 90 dias corridos após o encerramento da data oficial do evento. O convidado tem direito legal de solicitar a remoção imediata contatando nosso suporte.</p>
                  <h4>4. Auditoria de Consentimento</h4>
                  <p>Registramos para fins legais e não-repúdio: aceite ao consentimento, timestamp e endereço de IP da rede responsável pelo envio de dados de saúde.</p>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={{ ...styles.acceptBtn, backgroundColor: '#374151' }} 
                onClick={() => setIsModalOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
