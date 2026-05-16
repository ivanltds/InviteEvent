'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './suporte.module.css';

interface Ticket {
  id: string;
  usuario_id: string;
  status: 'aguardando_atendimento' | 'em_atendimento' | 'finalizado' | 'cancelado';
  created_at: string;
  email_usuario?: string;
  nome_usuario?: string;
  bot_active?: boolean;
  needs_human_attention?: boolean;
}

interface Message {
  id: string;
  ticket_id: string;
  remetente_id: string;
  conteudo: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  nome?: string;
}

interface Issue {
  id: string;
  titulo: string;
  descricao: string;
  status: 'aberta' | 'visualizada' | 'em_correcao' | 'corrigida';
  ticket_id?: string;
  suporte_tickets?: any[];
}

export default function MasterSupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Phase 3 New UI State Variables
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setActiveUserId(user.id);
        }

        // Buscar tickets
        const ticketsRes = await fetch('/api/support/tickets');
        const ticketsData = await ticketsRes.json();

        // Buscar perfis para obter e-mails
        const { data: perfis } = await supabase.from('perfis').select('id, email, nome');
        const profilesMap: Record<string, Profile> = {};
        if (perfis) {
          perfis.forEach((p: Profile) => {
            profilesMap[p.id] = p;
          });
        }

        if (ticketsData.success && ticketsData.tickets) {
          const ticketsWithUser = ticketsData.tickets.map((t: any) => ({
            ...t,
            email_usuario: profilesMap[t.usuario_id]?.email || 'usuario@gmail.com',
            nome_usuario: profilesMap[t.usuario_id]?.nome || 'Cliente',
          }));
          setTickets(ticketsWithUser);
        }

        // Fetch initial Issues & AI Config
        loadIssues();
        loadAiConfig();

      } catch (err) {
        console.error('Erro ao carregar tickets:', err);
      } finally {
        setLoadingTickets(false);
      }
    }

    loadInitialData();

    // Set up Realtime for tickets to grab bot switches
    const ticketChannel = supabase
      .channel('ticket-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suporte_tickets' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          // Buscar dados do perfil para não vir em branco
          supabase.from('perfis').select('email, nome').eq('id', payload.new.usuario_id).single().then(({ data: perfil }: any) => {
            const ticketComPerfil = {
              ...payload.new,
              email_usuario: perfil?.email || 'Novo Cliente',
              nome_usuario: perfil?.nome || 'Cliente',
            } as Ticket;
            
            setTickets(prev => {
              if (prev.some(t => t.id === ticketComPerfil.id)) return prev;
              return [ticketComPerfil, ...prev];
            });
          });
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          setSelectedTicket(curr => (curr && curr.id === payload.new.id) ? { ...curr, ...payload.new } : curr);
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .subscribe();

    const issuesChannel = supabase
      .channel('issues-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setIssues(prev => {
            if (prev.some(iss => iss.id === payload.new.id)) return prev;
            return [payload.new as Issue, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setIssues(prev => prev.map(iss => iss.id === payload.new.id ? { ...iss, ...payload.new } : iss));
        } else if (payload.eventType === 'DELETE') {
          setIssues(prev => prev.filter(iss => iss.id === payload.old.id));
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(ticketChannel); 
      supabase.removeChannel(issuesChannel); 
    };
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) return;

    loadMessages(selectedTicket.id);

    // 🔥 NOVO: Canal Realtime para Atualizar Mensagens no Painel sem precisar de F5
    const channelName = `admin-chat-${selectedTicket.id}`;
    const msgChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens', 
          filter: `ticket_id=eq.${selectedTicket.id}` 
        }, 
        (payload: any) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Proteção contra duplicidade na rede
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadIssues = async () => {
    try {
      const res = await fetch('/api/support/issues');
      const data = await res.json();
      if (data.success) setIssues(data.issues);
    } catch (e) {}
  };

  const loadAiConfig = async () => {
    try {
      const res = await fetch('/api/support/ai-config');
      const data = await res.json();
      if (data.success && data.data) setAiPrompt(data.data.system_prompt);
    } catch (e) {}
  };

  const handleSaveAiPrompt = async () => {
    setSavingPrompt(true);
    try {
      await fetch('/api/support/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: aiPrompt }),
      });
      setModalOpen(false);
    } catch (e) {}
    setSavingPrompt(false);
  };

  const loadMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim() || !activeUserId) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          remetente_id: activeUserId,
          conteudo: messageText,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => {
          // Evita duplicidade na corrida contra o canal Realtime
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        
        if (selectedTicket.status === 'aguardando_atendimento') {
          handleUpdateStatus('em_atendimento');
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: Ticket['status']) => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        const updated = { ...selectedTicket, status: newStatus };
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      }
    } catch (err) {
      console.error('Erro ao atualizar status do ticket:', err);
    }
  };

  const handleSwitchMode = async (mode: 'ai' | 'specialist') => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/control`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        // Updating local cache instantly to clear visual lag
        const updated = { 
          ...selectedTicket, 
          bot_active: mode === 'ai', 
          needs_human_attention: mode === 'ai' ? selectedTicket.needs_human_attention : false 
        };
        setSelectedTicket(updated);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
    } catch (e) {}
  };

  const handleUpdateIssueStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/support/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
      }
    } catch (e) {}
  };

  const calculateSLA = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const limitTime = createdTime + 2 * 60 * 60 * 1000;
    const diff = limitTime - currentTime;

    if (diff <= 0) {
      return { text: 'SLA Excedido', colorClass: styles.slaExceeded };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');
    const text = `SLA: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    let colorClass = styles.slaGreen;
    if (diff <= 30 * 60 * 1000) {
      colorClass = styles.slaRed;
    } else if (diff <= 90 * 60 * 1000) {
      colorClass = styles.slaOrange;
    }

    return { text, colorClass };
  };

  const getStatusLabel = (status: Ticket['status']) => {
    switch (status) {
      case 'aguardando_atendimento': return 'Aguardando';
      case 'em_atendimento': return 'Em Atendimento';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
    }
  };

  // Determine visual mode for the chat panel
  const isBotMode = selectedTicket?.bot_active !== false; // Default true if undefined

  return (
    <div className={styles.container}>
      
      {/* 1. Wrapped Header with Settings Dropdown (PRD-009 Phase 3) */}
      <div className={styles.titleArea}>
        <h1 className={styles.title} style={{marginBottom: 0, borderBottom: 'none'}}>Painel de Atendimento (Master)</h1>
        
        <div className={styles.settingsContainer}>
          <button 
            className={styles.settingsBtn}
            onClick={() => setDropdownOpen(!isDropdownOpen)}
          >
             Configurações
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem} onClick={() => { setModalOpen(true); setDropdownOpen(false); }}>
                Configurar Prompt da IA
              </div>
              <div className={styles.dropdownItem} onClick={() => { loadIssues(); setDropdownOpen(false); }}>
                Atualizar Painel
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Métricas */}
      <div className={styles.metricsContainer}>
        <h2 className={styles.metricsTitle}>Métricas de Desempenho</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total de Chamados</span>
            <strong className={styles.metricValue}>{tickets.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Pendentes Humanos</span>
            <strong className={styles.metricValue} style={{color: '#ef4444'}}>
              {tickets.filter(t => t.needs_human_attention === true).length}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Em Atendimento</span>
            <strong className={styles.metricValue}>
              {tickets.filter(t => t.status === 'em_atendimento').length}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Tempo Médio</span>
            <strong className={styles.metricValue}>00:15:30</strong>
          </div>
        </div>
      </div>

      <div className={`${styles.layout} ${selectedTicket ? styles.hasSelection : ''}`}>
        {/* Sidebar de Tickets */}
        <div className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Chamados Ativos</h2>
          {loadingTickets ? (
            <div className={styles.loader}>Carregando chamados...</div>
          ) : tickets.length === 0 ? (
            <div className={styles.empty}>Nenhum chamado aberto.</div>
          ) : (
            <div className={styles.ticketList}>
              {tickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const { text: slaText, colorClass: slaColor } = calculateSLA(ticket.created_at);

                return (
                  <div
                    key={ticket.id}
                    className={`${styles.ticketCard} ${isSelected ? styles.ticketCardActive : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                    style={ticket.needs_human_attention ? { borderLeft: '4px solid #ef4444' } : {}}
                  >
                    <div className={styles.ticketHeader}>
                      <span className={styles.userEmail}>{ticket.email_usuario}</span>
                      <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <div className={styles.ticketFooter}>
                      <span className={styles.clientName}>{ticket.nome_usuario}</span>
                      {(ticket.status === 'aguardando_atendimento' || ticket.status === 'em_atendimento') && (
                        <span className={`${styles.slaBadge} ${slaColor}`}>{slaText}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Painel de Conversa Dinâmico (PRD-009) */}
        <div className={`${styles.chatPanel} ${selectedTicket ? (isBotMode ? styles.chatPanelAI : styles.chatPanelSpecialist) : ''}`}>
          {selectedTicket ? (
            <div className={styles.chatContainer}>
              {/* Header do Chat com Switcher */}
              <div className={styles.chatHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <button 
                    className={styles.backButton} 
                    onClick={() => setSelectedTicket(null)}
                  >
                    ← Voltar
                  </button>
                  <div style={{marginLeft: '10px'}}>
                    <h3 className={styles.chatUser}>{selectedTicket.email_usuario}</h3>
                    <p className={styles.chatSub}>Visualizando histórico do cliente</p>
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center'}}>
                  {/* HYBRID SWITCHER - NO EMOJIS as required by user */}
                  <div className={styles.switchContainer}>
                    <button 
                      className={`${styles.switchBtn} ${isBotMode ? styles.switchBtnActiveAI : ''}`}
                      onClick={() => handleSwitchMode('ai')}
                    >
                      BOT
                    </button>
                    <button 
                      className={`${styles.switchBtn} ${!isBotMode ? styles.switchBtnActiveSpec : ''}`}
                      onClick={() => handleSwitchMode('specialist')}
                    >
                      ESPECIALISTA
                    </button>
                  </div>

                  <div className={styles.statusControls} style={{marginLeft: '1rem'}}>
                    <select
                      id="status-select"
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as Ticket['status'])}
                      className={styles.statusSelect}
                    >
                      <option value="aguardando_atendimento">Aguardando</option>
                      <option value="em_atendimento">Em Atendimento</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Corpo das Mensagens */}
              <div className={styles.chatMessages}>
                {loadingMessages ? (
                  <div className={styles.loader}>Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className={styles.empty}>Nenhuma mensagem neste chamado.</div>
                ) : (
                  messages.map((msg) => {
                            const isMe = msg.remetente_id === activeUserId;
                            const isBot = msg.remetente_id === '00000000-0000-0000-0000-000000000000';
                            
                            return (
                              <div
                                key={msg.id}
                                className={`${styles.messageWrapper} ${isMe || isBot ? styles.messageMe : styles.messageOther}`}
                              >
                                {isBot && <span className={styles.aiBadge}>AI Assistente</span>}
                                <div className={styles.messageBubble} style={isBot ? { background: 'rgba(197, 160, 89, 0.05)', border: '1px solid rgba(197, 160, 89, 0.25)', color: 'var(--admin-text-primary)' } : {}}>
                                  <div className={styles.messageText}>
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({node, ...props}) => <p style={{ margin: 0, marginBottom: '6px' }} {...props} />,
                                        ul: ({node, ...props}) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                                        ol: ({node, ...props}) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                                        li: ({node, ...props}) => <li style={{ marginBottom: '2px' }} {...props} />,
                                        strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: 'inherit' }} {...props} />,
                                      }}
                                    >
                                      {msg.conteudo}
                                    </ReactMarkdown>
                                  </div>
                                  <span className={styles.messageTime}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                  })
                )}
                
                {/* 3. The Explicit Specialist Announcement from User Request */}
                {!isBotMode && selectedTicket.status !== 'finalizado' && (
                  <div className={styles.sysSeparator}>
                    Você será atendido em breve por um dos nossos especialistas.
                  </div>
                )}

                {selectedTicket.status === 'finalizado' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                    <hr style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '12px' }} />
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                      Atendimento Finalizado
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Caixa de Entrada */}
              <form onSubmit={handleSendMessage} className={styles.chatInputContainer}>
                <input
                  type="text"
                  placeholder={isBotMode ? "Inteligência artificial monitorando..." : "Digite a resposta para o cliente..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className={styles.chatInput}
                  disabled={isBotMode}
                />
                <button type="submit" className={styles.sendButton} disabled={isBotMode} style={!isBotMode ? { background: '#3b82f6', color: '#fff' } : {}}>
                  Responder
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.chatPlaceholder}>
              <div className={styles.placeholderIcon}>
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" style={{opacity: 0.3}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <h3>Selecione um chamado</h3>
              <p>Escolha um ticket na lista lateral para iniciar o atendimento de suporte.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. KANBAN TRACKER INJECTION (PRD-009) */}
      <div className={styles.kanbanWrapper}>
        <h2 className={styles.kanbanTitle}>Rastreador de Issues Ativas</h2>
        <div className={styles.kanbanGrid}>
          
          {/* Coluna: Aberta */}
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}>
              <div className={styles.dot} style={{background: 'var(--admin-accent)'}} /> Aberta
            </div>
            {issues.filter(i => i.status === 'aberta').map(issue => (
              <div key={issue.id} className={styles.issueCard} onClick={() => handleUpdateIssueStatus(issue.id, 'visualizada')}>
                <div className={styles.issueTitle}>{issue.titulo}</div>
                {issue.suporte_tickets && issue.suporte_tickets.length > 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.6, color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Afeta: {issue.suporte_tickets.map((tk: any) => tk.perfis?.nome || tk.perfis?.email || 'Cliente').join(', ')}
                  </div>
                )}
                <div className={styles.issueMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Issue #{issue.id.slice(0,5).toUpperCase()}</span>
                  <span style={{ backgroundColor: 'rgba(197, 160, 89, 0.15)', color: 'var(--admin-accent)', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    👥 {issue.suporte_tickets?.length || 0} Chamados
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna: Visualizada */}
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}>
              <div className={styles.dot} style={{background: '#3b82f6'}} /> Visualizada
            </div>
            {issues.filter(i => i.status === 'visualizada').map(issue => (
              <div key={issue.id} className={styles.issueCard} onClick={() => handleUpdateIssueStatus(issue.id, 'em_correcao')}>
                <div className={styles.issueTitle}>{issue.titulo}</div>
                {issue.suporte_tickets && issue.suporte_tickets.length > 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.6, color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Afeta: {issue.suporte_tickets.map((tk: any) => tk.perfis?.nome || tk.perfis?.email || 'Cliente').join(', ')}
                  </div>
                )}
                <div className={styles.issueMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Em análise</span>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    👥 {issue.suporte_tickets?.length || 0} Chamados
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna: Em Correção */}
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}>
              <div className={styles.dot} style={{background: '#f97316'}} /> Em Correção
            </div>
            {issues.filter(i => i.status === 'em_correcao').map(issue => (
              <div key={issue.id} className={styles.issueCard} onClick={() => handleUpdateIssueStatus(issue.id, 'corrigida')}>
                <div className={styles.issueTitle}>{issue.titulo}</div>
                {issue.suporte_tickets && issue.suporte_tickets.length > 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.6, color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Afeta: {issue.suporte_tickets.map((tk: any) => tk.perfis?.nome || tk.perfis?.email || 'Cliente').join(', ')}
                  </div>
                )}
                <div className={styles.issueMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Dev atuando</span>
                  <span style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    👥 {issue.suporte_tickets?.length || 0} Chamados
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna: Corrigida */}
          <div className={styles.kanbanCol}>
            <div className={styles.kanbanHeader}>
              <div className={styles.dot} style={{background: '#22c55e'}} /> Corrigida
            </div>
            {issues.filter(i => i.status === 'corrigida').map(issue => (
              <div key={issue.id} className={styles.issueCard} style={{ opacity: 0.7 }}>
                <div className={styles.issueTitle}>{issue.titulo}</div>
                {issue.suporte_tickets && issue.suporte_tickets.length > 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.6, color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Afeta: {issue.suporte_tickets.map((tk: any) => tk.perfis?.nome || tk.perfis?.email || 'Cliente').join(', ')}
                  </div>
                )}
                <div className={styles.issueMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Finalizada</span>
                  <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    👥 {issue.suporte_tickets?.length || 0} Chamados
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 5. CONFIGURATION MODAL INJECTION (PRD-009) */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>×</button>
            <h2 className={styles.modalTitle}>Configuração Neural</h2>
            <p className={styles.modalSub}>Define o System Prompt global que comanda a conduta do robô assistente.</p>
            
            <textarea 
              className={styles.promptEditor}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Você é o assistente..."
            />

            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
              <button 
                className={styles.btnPrimary} 
                onClick={handleSaveAiPrompt}
                disabled={savingPrompt}
              >
                {savingPrompt ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
