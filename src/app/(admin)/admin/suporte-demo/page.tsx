'use client';

import React, { useState } from 'react';
import styles from './suporteDemo.module.css';

export default function LiveSuporteDemo() {
  // Simulated component internal state for visual interactions
  const [mode, setMode] = useState<'ai' | 'specialist'>('ai');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      
      {/* Title & Config Gear */}
      <div className={styles.titleArea}>
        <h1 className={styles.title}>Central de Atendimento</h1>
        
        <div className={styles.settingsContainer}>
          <button 
            className={styles.settingsBtn} 
            onClick={() => setDropdownOpen(!isDropdownOpen)}
          >
            Configurações
          </button>
          
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div 
                className={styles.dropdownItem} 
                onClick={() => {
                  setModalOpen(true);
                  setDropdownOpen(false);
                }}
              >
                Configurar Prompt da IA
              </div>
              <div className={styles.dropdownItem}>Performance do Bot</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout with Real Classes */}
      <div className={styles.layout}>
        
        {/* Side Ticket View (Mocked Sidebar) */}
        <aside className={styles.sidebar}>
           <h3 style={{marginBottom: '1rem', fontSize: '1.1rem', fontFamily: 'var(--font-serif)'}}>Chamados Ativos</h3>
           <div style={{
             background: 'var(--admin-sidebar-active-bg)', 
             border: '1px solid var(--admin-accent)', 
             borderRadius: '8px', 
             padding: '1rem',
             cursor: 'default'
           }}>
             <div style={{fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--admin-text-primary)'}}>
               Marcos Souza
             </div>
             <div style={{fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginTop: '5px'}}>
               marcos@exemplo.com
             </div>
             <div style={{marginTop: '8px'}}>
               <span style={{
                 background: 'var(--admin-accent)', 
                 color: '#111', 
                 fontSize: '0.65rem', 
                 fontWeight: 700, 
                 padding: '2px 6px', 
                 borderRadius: '4px'
               }}>EM ATENDIMENTO</span>
             </div>
           </div>
        </aside>

        {/* Chat Interaction Center - DYNAMIC BORDER APPLIED */}
        <section className={`${styles.chatPanel} ${mode === 'ai' ? styles.chatPanelAI : styles.chatPanelSpecialist}`}>
          
          <header className={styles.chatHeader}>
            <div>
              <h3 style={{fontSize: '1rem', color: 'var(--admin-text-primary)'}}>Visualizando Conversa</h3>
              <span style={{fontSize: '0.75rem', color: 'var(--admin-text-secondary)'}}>Ticket #492</span>
            </div>

            {/* The Official Switcher - STRICTLY NO EMOJIS per User instruction */}
            <div className={styles.switchContainer}>
              <button 
                className={`${styles.switchBtn} ${mode === 'ai' ? styles.switchBtnActiveAI : ''}`}
                onClick={() => setMode('ai')}
              >
                BOT
              </button>
              <button 
                className={`${styles.switchBtn} ${mode === 'specialist' ? styles.switchBtnActiveSpec : ''}`}
                onClick={() => setMode('specialist')}
              >
                ESPECIALISTA
              </button>
            </div>
          </header>

          {/* Flow of Messages */}
          <div className={styles.chatMessages}>
            
            {/* Guest Msg */}
            <div className={`${styles.messageWrapper} ${styles.messageOther}`}>
              <div className={styles.bubble}>
                Olá, não estou conseguindo gerar o código PIX para o presente. O sistema diz que expirou.
              </div>
            </div>

            {/* AI Msg (Legacy) */}
            <div className={`${styles.messageWrapper} ${styles.messageMe} ${styles.messageAI}`}>
              <span className={styles.aiBadge}>AI Assistente</span>
              <div className={styles.bubble}>
                Olá Marcos! Verifiquei aqui que a sessão expirou automaticamente por segurança. Acabei de revalidar o item na lista e estou enviando um novo link agora mesmo!
              </div>
            </div>

            {/* User frustrated */}
            <div className={`${styles.messageWrapper} ${styles.messageOther}`}>
              <div className={styles.bubble}>
                Continua dando falha crítica de autorização no checkout. Podem ver isso por favor?
              </div>
            </div>

            {/* AI Automatic Escape and Logic Trigger */}
            <div className={`${styles.messageWrapper} ${styles.messageMe} ${styles.messageAI}`}>
              <span className={styles.aiBadge}>AI Assistente</span>
              <div className={styles.bubble}>
                Sinto muito pelo ocorrido. Detectei um comportamento inesperado e registrei um relatório técnico instantâneo para nossa equipe investigar.
              </div>
            </div>

            {/* THE SPECIFIC SYSTEM ANNOUNCEMENT WHEN SPECIALIST ASSUMES */}
            {mode === 'specialist' && (
              <div className={styles.sysSeparator}>
                Você será atendido em breve por um dos nossos especialistas.
              </div>
            )}

          </div>

          {/* Input Controls locked based on State */}
          <div className={styles.chatInputArea}>
            <input 
              type="text" 
              className={styles.chatInput} 
              placeholder={mode === 'ai' ? "Inteligência Artificial monitorando..." : "Digite sua resposta direta ao convidado..."}
              disabled={mode === 'ai'}
            />
            <button 
              className={styles.btnSend}
              style={mode === 'specialist' ? { background: '#3b82f6', color: '#fff' } : {}}
            >
              Enviar
            </button>
          </div>
        </section>

      </div>

      {/* Kanban View at bottom */}
      <div>
        <h2 style={{fontFamily: 'var(--font-serif)', marginBottom: '1rem', fontSize: '1.2rem'}}>Rastreador de Issues Ativas</h2>
        <div className={styles.kanbanGrid}>
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}><div className={styles.dot} style={{background: 'var(--admin-accent)'}}></div> Aberta</div>
            <div className={styles.issueCard}>
               <div style={{fontWeight: 'bold', color: 'var(--admin-text-primary)'}}>Falha Crítica Checkout</div>
               <div style={{fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginTop: '4px'}}>Ticket #492</div>
            </div>
          </div>
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}><div className={styles.dot} style={{background: '#3b82f6'}}></div> Visualizada</div>
          </div>
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}><div className={styles.dot} style={{background: '#f97316'}}></div> Em Correção</div>
          </div>
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}><div className={styles.dot} style={{background: '#22c55e'}}></div> Corrigida</div>
          </div>
        </div>
      </div>

      {/* SYSTEM PROMPT CONFIG MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>×</button>
            <h2 style={{fontFamily: 'var(--font-serif)', fontSize: '1.5rem'}}>Configuração Neural</h2>
            <p style={{fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginTop: '0.5rem'}}>
              Defina o System Prompt da IA para herdar a conduta do ecossistema.
            </p>
            <textarea 
              className={styles.promptEditor}
              defaultValue={`Você é o assistente oficial. 
REGRAS: Cordial, empático.
Ao detectar falhas técnicas críticas, gere uma ISSUE e transfira para o Especialista.`}
            />
            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
              <button 
                className={styles.btnSend} 
                style={{padding: '10px 20px'}}
                onClick={() => setModalOpen(false)}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
