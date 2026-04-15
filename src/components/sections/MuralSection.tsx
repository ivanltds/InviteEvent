'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Mural.module.css';
import { muralService, MuralMensagem } from '@/lib/services/muralService';
import { Configuracao } from '@/lib/types/database';

interface MuralSectionProps {
  eventoId: string;
  config?: Configuracao;
}

export default function MuralSection({ eventoId, config }: MuralSectionProps) {
  const [messages, setMessages] = useState<MuralMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', mensagem: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await muralService.getMessages(eventoId);
        setMessages(data);
      } catch (e) {
        console.error('Erro ao carregar mural:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await muralService.submitMessage(eventoId, formData.nome, formData.mensagem);
    if (success) {
      setSubmitted(true);
      setFormData({ nome: '', mensagem: '' });
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <section className={styles.section} id="mural">
      <div className={styles.container}>
        <motion.h2 
          className="cursive"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ color: config?.accent_color }}
        >
          Mural de Carinho
        </motion.h2>
        <p className={styles.subtitle}>Deixe uma mensagem especial para os noivos</p>

        <div className={styles.actionRow}>
          <button 
            className={styles.addBtn} 
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: config?.accent_color }}
          >
            Escrever Recado
          </button>
        </div>

        <div className={styles.muralGrid}>
          {loading ? (
            <p>Carregando recados...</p>
          ) : messages.length === 0 ? (
            <p className={styles.empty}>Seja o primeiro a deixar um recado carinhoso!</p>
          ) : (
            messages.map((msg, index) => (
              <motion.div 
                key={msg.id}
                className={styles.messageCard}
                initial={{ opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 5) * 0.1 }}
              >
                <p className={styles.text}>"{msg.mensagem}"</p>
                <div className={styles.footer}>
                  <span className={styles.author}>{msg.nome_convidado}</span>
                  <span className={styles.date}>{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modal}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>&times;</button>
              
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <h3 className="cursive">Deixe seu carinho</h3>
                  <div className={styles.field}>
                    <label>Seu Nome</label>
                    <input 
                      value={formData.nome} 
                      onChange={e => setFormData({...formData, nome: e.target.value})} 
                      required 
                      placeholder="Como quer ser identificado?"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Sua Mensagem</label>
                    <textarea 
                      value={formData.mensagem} 
                      onChange={e => setFormData({...formData, mensagem: e.target.value})} 
                      required 
                      rows={4}
                      placeholder="Escreva algo do fundo do coração..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    className={styles.submitBtn} 
                    disabled={isSubmitting}
                    style={{ backgroundColor: config?.accent_color }}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </form>
              ) : (
                <div className={styles.success}>
                  <div className={styles.successIcon}>✨</div>
                  <h3>Mensagem enviada!</h3>
                  <p>Obrigado pelo carinho. Sua mensagem será exibida em breve após a moderação dos noivos.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
