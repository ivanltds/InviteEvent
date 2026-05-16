'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Ticket {
  id: string;
  status: 'aguardando_atendimento' | 'em_atendimento' | 'finalizado' | 'cancelado';
  created_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  remetente_id: string;
  conteudo: string;
  created_at: string;
}

export default function FloatingChatWidget({ usuarioId = 'test-user-id', eventoId = '' }: { usuarioId?: string; eventoId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUserId, setActiveUserId] = useState(usuarioId);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar o ID do usuário autenticado real (Owner, Organizer, Staff)
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setActiveUserId(user.id);
        }
      } catch (err) {
        console.error('Erro ao obter usuário autenticado:', err);
      }
    }
    loadUser();
  }, []);

  // Carregar ou criar ticket ativo
  useEffect(() => {
    if (!isOpen) return;

    async function loadSupport() {
      if (!activeUserId) return;
      try {
        const res = await fetch(`/api/support/tickets?usuarioId=${activeUserId}`);
        const data = await res.json();
        if (data.success && data.tickets && data.tickets.length > 0) {
          let activeTicket = data.tickets.find((t: Ticket) => t.status !== 'finalizado' && t.status !== 'cancelado');
          if (!activeTicket) {
            // Load the last ticket to show history and finalization message
            activeTicket = data.tickets[data.tickets.length - 1];
          }
          if (activeTicket) {
            setTicket(activeTicket);
            loadMessages(activeTicket.id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar suporte:', err);
      }
    }

    loadSupport();
  }, [isOpen, activeUserId]);

  // Carregar mensagens do ticket e assinar tempo real
  useEffect(() => {
    if (!ticket?.id) return;

    loadMessages(ticket.id);

    // Injetando Canal de Tempo Real para Capturar Respostas do Robô/Especialista
    const channelName = `chat-ticket-${ticket.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'suporte_mensagens', 
          filter: `ticket_id=eq.${ticket.id}` 
        }, 
        (payload: any) => {
          // Adiciona a mensagem nova à lista local apenas se ela não for do usuário atual 
          // (pois a do usuário já adicionamos localmente pra ser mais rápido)
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Evita duplicidade caso já tenha inserido localmente
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  // Função para carregar carga inicial de mensagens
  async function loadMessages(ticketId: string) {
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }

  // Enviar mensagem
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    let currentTicketId = ticket?.id;

    try {
      // Se não houver ticket ativo, ou o ticket atual estiver finalizado/cancelado, cria um na hora
      if (!currentTicketId || ticket?.status === 'finalizado' || ticket?.status === 'cancelado') {
        const ticketRes = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: activeUserId, evento_id: eventoId }),
        });
        const ticketData = await ticketRes.json();
        if (ticketData.success && ticketData.ticket) {
          setTicket(ticketData.ticket);
          currentTicketId = ticketData.ticket.id;
          // Clear previous messages as it's a new ticket
          setMessages([]);
        } else {
          return;
        }
      }

      // Envia a mensagem
      const msgRes = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: currentTicketId,
          remetente_id: activeUserId,
          conteudo: newMessage,
        }),
      });
      const msgData = await msgRes.json();
      if (msgData.success && msgData.message) {
        setMessages((prev) => {
          // Prevents race condition duplication with Realtime insertion
          if (prev.some(m => m.id === msgData.message.id)) return prev;
          return [...prev, msgData.message];
        });
        setNewMessage('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  }

  // Scroll automático para o final da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, fontFamily: 'sans-serif' }}>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: '#1a1a1a',
          color: '#C5A059',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: '24px',
          fontWeight: 'bold',
          outline: 'none',
        }}
        aria-label="Abrir suporte por chat"
      >
        ✧
      </button>

      {/* Caixa de Chat */}
      {isOpen && (
        <div
          className="support-chat-window"
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '320px',
            height: '420px',
            backgroundColor: '#0d0d0d',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #161616, #0d0d0d)',
              borderBottom: '1px solid rgba(197, 160, 89, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#C5A059' }}>Suporte ao Cliente</h3>
              <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>Atendimento Exclusivo</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', display: 'none' }}
              className="mobile-close-btn"
            >×</button>
            {ticket && (
              <div className="ticket-status" style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: (ticket.status === 'finalizado' || ticket.status === 'cancelado') ? '#888' : '#C5A059' 
                }}>
                  {ticket.status === 'finalizado' ? 'Finalizado' : ticket.status === 'cancelado' ? 'Cancelado' : 'Ativo'}
                </span>
              </div>
            )}
          </div>

          {/* Área de Mensagens */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
                <span style={{ color: 'rgba(197, 160, 89, 0.3)', fontSize: '32px', marginBottom: '8px' }}>✧</span>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                  Olá! Envie uma mensagem abaixo para abrir um ticket de atendimento imediato.
                </p>
              </div>
            ) : (
              /* Explicit final safety deduplication to permanently kill duplicate-key warnings */
              Array.from(new Map(messages.map(m => [m.id, m])).values()).map((msg) => {
                const isUser = msg.remetente_id === activeUserId;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 12px',
                        borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        fontSize: '12px',
                        lineHeight: '1.4',
                        backgroundColor: isUser ? 'rgba(197, 160, 89, 0.1)' : '#1f1f1f',
                        color: isUser ? '#f5e6cc' : '#e5e5e5',
                        border: isUser ? '1px solid rgba(197, 160, 89, 0.2)' : 'none',
                      }}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p style={{ margin: 0, marginBottom: '6px' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginBottom: '2px' }} {...props} />,
                        }}
                      >
                        {msg.conteudo}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })
            )}
            
            {ticket?.status === 'finalizado' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0', width: '100%' }}>
                <hr style={{ width: '100%', border: 'none', borderTop: '1px dashed rgba(255, 255, 255, 0.2)', marginBottom: '12px' }} />
                <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                  Atendimento Finalizado
                </span>
                <span style={{ fontSize: '10px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
                  Envie uma nova mensagem para iniciar um novo atendimento.
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px',
              backgroundColor: '#0d0d0d',
              borderTop: '1px solid rgba(197, 160, 89, 0.1)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={newMessage || ''}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isSending ? "Enviando..." : "Digite sua mensagem..."}
              disabled={isSending}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(197, 160, 89, 0.2)',
                backgroundColor: '#141414',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSending}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #C5A059, #B38F48)',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 600px) {
          .support-chat-window {
            position: fixed !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 85% !important;
            height: 85dvh !important;
            border-radius: 24px 24px 0 0 !important;
            z-index: 100000 !important;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.5) !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .ticket-status {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
