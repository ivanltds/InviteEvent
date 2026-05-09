'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  const [slaColor, setSlaColor] = useState('text-emerald-500');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          body: JSON.stringify({ usuario_id: usuarioId, evento_id: eventoId }),
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
          remetente_id: usuarioId,
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
        setSlaColor('text-rose-500 font-bold animate-pulse');
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
        setSlaColor('text-emerald-500'); // Verde (> 1h)
      } else if (remaining > 30 * 60 * 1000) {
        setSlaColor('text-amber-500'); // Amarelo (30m - 1h)
      } else {
        setSlaColor('text-rose-500 animate-pulse'); // Vermelho (< 30m)
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-950 text-amber-500 rounded-full flex items-center justify-center shadow-xl hover:bg-slate-900 border border-amber-500/30 transition-all duration-300 hover:scale-105 active:scale-95 relative"
        aria-label="Abrir suporte por chat"
      >
        <span className="text-2xl">✧</span>
      </button>

      {/* Caixa de Chat */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-500/20 flex flex-col overflow-hidden animate-fade-in transition-all">
          {/* Cabeçalho */}
          <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-amber-500/10 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-amber-500">Suporte ao Cliente</h3>
              <p className="text-xs text-slate-400">Atendimento Exclusivo</p>
            </div>
            {ticket && (
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 block">SLA Restante</span>
                <span className={`text-xs font-semibold ${slaColor}`}>{slaText}</span>
              </div>
            )}
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-amber-500/30 text-3xl mb-2">✧</span>
                <p className="text-xs text-slate-500">Olá! Envie uma mensagem abaixo para abrir um ticket de atendimento imediato.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.remetente_id === usuarioId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-2.5 rounded-2xl text-xs ${
                        isUser
                          ? 'bg-amber-500/10 text-amber-100 border border-amber-500/20 rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none'
                      }`}
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
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-amber-500/10 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-xl border border-amber-500/10 focus:outline-none focus:border-amber-500/40"
            />
            <button
              type="submit"
              className="px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
