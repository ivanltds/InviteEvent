'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [slaText, setSlaText] = useState('02:00:00');
  const [slaColor, setSlaColor] = useState('#10b981'); // Verde
  const [activeUserId, setActiveUserId] = useState(usuarioId);
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
      try {
        const res = await fetch('/api/support/tickets');
        const data = await res.json();
        if (data.success && data.tickets && data.tickets.length > 0) {
          const activeTicket = data.tickets.find((t: Ticket) => t.status !== 'finalizado' && t.status !== 'cancelado');
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
  }, [isOpen]);

  // Carregar mensagens do ticket
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
    if (!newMessage.trim()) return;

    let currentTicketId = ticket?.id;

    try {
      // Se não houver ticket ativo, cria um na hora
      if (!currentTicketId) {
        const ticketRes = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: activeUserId, evento_id: eventoId }),
        });
        const ticketData = await ticketRes.json();
        if (ticketData.success && ticketData.ticket) {
          setTicket(ticketData.ticket);
          currentTicketId = ticketData.ticket.id;
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
        setMessages((prev) => [...prev, msgData.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  }

  // Scroll automático para o final da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Intervalo de cálculo de SLA de 2h
  useEffect(() => {
    if (!ticket) return;

    const interval = setInterval(() => {
      const creationTime = new Date(ticket.created_at).getTime();
      const limitTime = creationTime + 2 * 60 * 60 * 1000; // 2 horas
      const now = new Date().getTime();
      const remaining = limitTime - now;

      if (remaining <= 0) {
        setSlaText('SLA Excedido');
        setSlaColor('#ef4444');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const formatted = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setSlaText(formatted);

      if (remaining > 1 * 60 * 60 * 1000) {
        setSlaColor('#10b981'); // Verde (> 1h)
      } else if (remaining > 30 * 60 * 1000) {
        setSlaColor('#f59e0b'); // Amarelo (30m - 1h)
      } else {
        setSlaColor('#ef4444'); // Vermelho (< 30m)
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket]);

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
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '320px',
            height: '380px',
            backgroundColor: '#0d0d0d',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
            {ticket && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#555', display: 'block' }}>SLA Restante</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: slaColor }}>{slaText}</span>
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
              messages.map((msg) => {
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
                      {msg.conteudo}
                    </div>
                  </div>
                );
              })
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
              placeholder="Digite sua mensagem..."
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
    </div>
  );
}
