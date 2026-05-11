'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './suporte.module.css';

interface Ticket {
  id: string;
  usuario_id: string;
  status: 'aguardando_atendimento' | 'em_atendimento' | 'finalizado' | 'cancelado';
  created_at: string;
  email_usuario?: string;
  nome_usuario?: string;
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

export default function MasterSupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Atualiza o relógio a cada segundo para o SLA regressivo
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
      } catch (err) {
        console.error('Erro ao carregar tickets:', err);
      } finally {
        setLoadingTickets(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        setMessages((prev) => [...prev, data.message]);
        
        // Se o ticket estava aguardando atendimento, passa para em_atendimento automaticamente
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

  // Cálculo do SLA Regressivo (2h a partir do momento de criação)
  const calculateSLA = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const limitTime = createdTime + 2 * 60 * 60 * 1000; // +2 horas
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
      colorClass = styles.slaRed; // <= 30 minutos
    } else if (diff <= 90 * 60 * 1000) {
      colorClass = styles.slaOrange; // <= 1h30
    }

    return { text, colorClass };
  };

  const getStatusLabel = (status: Ticket['status']) => {
    switch (status) {
      case 'aguardando_atendimento':
        return 'Aguardando';
      case 'em_atendimento':
        return 'Em Atendimento';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Painel de Atendimento (Master)</h1>

      {/* Seção de Métricas de Desempenho (Dashboard Fase 4) */}
      <div className={styles.metricsContainer}>
        <h2 className={styles.metricsTitle}>Métricas de Desempenho</h2>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total de Chamados</span>
            <strong className={styles.metricValue}>{tickets.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Aguardando</span>
            <strong className={styles.metricValue}>
              {tickets.filter(t => t.status === 'aguardando_atendimento').length}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Em Atendimento</span>
            <strong className={styles.metricValue}>
              {tickets.filter(t => t.status === 'em_atendimento').length}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Tempo Médio de Resposta</span>
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

        {/* Painel de Conversa */}
        <div className={styles.chatPanel}>
          {selectedTicket ? (
            <div className={styles.chatContainer}>
              {/* Header do Chat */}
              <div className={styles.chatHeader}>
                <button 
                  className={styles.backButton} 
                  onClick={() => setSelectedTicket(null)}
                  aria-label="Voltar para a lista"
                >
                  ← Voltar
                </button>
                <div>
                  <h3 className={styles.chatUser}>{selectedTicket.email_usuario}</h3>
                  <p className={styles.chatSub}>Visualizando histórico do cliente</p>
                </div>

                {/* Controles de Status */}
                <div className={styles.statusControls}>
                  <label htmlFor="status-select" className={styles.statusLabel}>Status:</label>
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

              {/* Corpo das Mensagens */}
              <div className={styles.chatMessages}>
                {loadingMessages ? (
                  <div className={styles.loader}>Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className={styles.empty}>Nenhuma mensagem neste chamado.</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.remetente_id === activeUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.messageWrapper} ${isMe ? styles.messageMe : styles.messageOther}`}
                      >
                        <div className={styles.messageBubble}>
                          <p className={styles.messageText}>{msg.conteudo}</p>
                          <span className={styles.messageTime}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {selectedTicket.status === 'finalizado' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                    <hr style={{ width: '100%', borderColor: 'rgba(197, 160, 89, 0.2)', marginBottom: '12px' }} />
                    <span style={{ fontSize: '11px', color: '#C5A059', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(197, 160, 89, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                      Atendimento Finalizado
                    </span>
                    <span style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                      O SLA foi interrompido.
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Caixa de Entrada */}
              <form onSubmit={handleSendMessage} className={styles.chatInputContainer}>
                <input
                  type="text"
                  placeholder="Digite a resposta para o cliente..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className={styles.chatInput}
                />
                <button type="submit" className={styles.sendButton}>
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
    </div>
  );
}
