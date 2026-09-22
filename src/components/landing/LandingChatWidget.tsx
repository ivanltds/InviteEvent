'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LandingChatWidget.module.css';

const SESSION_STORAGE_KEY = 'landing_chat_session_id';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    // localStorage indisponível — sessão dura só a visita atual.
    return crypto.randomUUID();
  }
}

function getUtmParams(): { source?: string; medium?: string; campaign?: string } | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source') || undefined;
  const medium = params.get('utm_medium') || undefined;
  const campaign = params.get('utm_campaign') || undefined;
  if (!source && !medium && !campaign) return undefined;
  return { source, medium, campaign };
}

/**
 * Assistente de vendas/orientação da Landing Page (STORY-062). Widget novo
 * e independente do FloatingChatWidget (suporte pós-login) — sem ticket,
 * sem handoff humano, focado em explicar o produto pra visitante anônimo e
 * capturar contato quando a conversa chegar num ponto natural. Ver
 * src/lib/services/landingChatService.ts.
 */
export default function LandingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Restaura a conversa da sessão na primeira vez que o widget é aberto.
  useEffect(() => {
    if (!isOpen || !sessionId || historyLoaded) return;

    async function loadHistory(id: string) {
      try {
        const res = await fetch(`/api/landing-chat?sessionId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: { role: 'user' | 'assistant'; conteudo: string }, i: number) => ({
              id: `history-${i}`,
              role: m.role,
              content: m.conteudo,
            }))
          );
        }
      } catch (err) {
        console.error('Erro ao carregar histórico do chat da landing:', err);
      } finally {
        setHistoryLoaded(true);
      }
    }

    loadHistory(sessionId);
  }, [isOpen, sessionId, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setInput('');
    setMessages(prev => [...prev, { id: `local-${Date.now()}`, role: 'user', content: text }]);
    setSending(true);

    try {
      const res = await fetch('/api/landing-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, utm: getUtmParams() }),
      });
      const data = await res.json();
      const reply = data.success && data.response ? data.response : 'Desculpa, não consegui responder agora. Tenta de novo em instantes?';
      setMessages(prev => [...prev, { id: `reply-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Erro ao enviar mensagem do chat da landing:', err);
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: 'Desculpa, não consegui responder agora. Tenta de novo em instantes?' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.launcher}
        aria-label={isOpen ? 'Fechar chat' : 'Tirar dúvidas sobre a Celebraê'}
      >
        {isOpen ? '×' : '✧'}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.headerTitle}>Fale com a gente</h3>
              <p className={styles.headerSubtitle}>Tire dúvidas sobre a Celebraê</p>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.length === 0 && !sending && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>✧</span>
                <p>Oi! Quer saber como funciona o convite digital, o RSVP ou a lista de presentes? Pergunta aqui.</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : ''}`}>
                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ ...props }) => <p style={{ margin: 0, marginBottom: '6px' }} {...props} />,
                      ul: ({ ...props }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                      ol: ({ ...props }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }} {...props} />,
                      li: ({ ...props }) => <li style={{ marginBottom: '2px' }} {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {sending && (
              <div className={styles.messageRow}>
                <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={sending ? 'Aguardando resposta...' : 'Digite sua pergunta...'}
              disabled={sending}
              className={styles.input}
            />
            <button type="submit" disabled={sending || !input.trim()} className={styles.sendBtn}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
