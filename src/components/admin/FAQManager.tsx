'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AdminComponents.module.css';

interface FAQ {
  id: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  evento_id?: string;
}

export default function FAQManager({ eventoId }: { eventoId?: string }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ pergunta: '', resposta: '', ordem: 0 });
  // Bug reportado pelo usuário em 21/09/2026 ("quando eu edito a faq
  // ela não esta mudando"): a causa raiz era RLS bloqueando a leitura/
  // escrita silenciosamente — nem o insert/update nem o fetch
  // verificavam erro nenhum, então a tela parecia "funcionar" mesmo
  // sem salvar nada de verdade. Agora qualquer erro do Supabase fica
  // visível em vez de sumir.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFaqs = async () => {
    if (!eventoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('evento_id', eventoId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('[FAQManager] Erro ao carregar FAQ:', error);
      setErrorMsg('Não foi possível carregar as perguntas. Tente recarregar a página.');
    } else {
      setErrorMsg(null);
    }
    if (data) setFaqs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId) return;

    setErrorMsg(null);
    const { error } = editingId
      ? await supabase.from('faq').update(formData).eq('id', editingId)
      : await supabase.from('faq').insert([{ ...formData, evento_id: eventoId }]);

    if (error) {
      console.error('[FAQManager] Erro ao salvar FAQ:', error);
      setErrorMsg('Não foi possível salvar essa pergunta. Tente novamente em instantes.');
      return;
    }

    setFormData({ pergunta: '', resposta: '', ordem: 0 });
    setEditingId(null);
    fetchFaqs();
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({ pergunta: faq.pergunta, resposta: faq.resposta, ordem: faq.ordem });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta pergunta?')) {
      setErrorMsg(null);
      const { error } = await supabase.from('faq').delete().eq('id', id);
      if (error) {
        console.error('[FAQManager] Erro ao excluir FAQ:', error);
        setErrorMsg('Não foi possível excluir essa pergunta. Tente novamente em instantes.');
        return;
      }
      fetchFaqs();
    }
  };

  if (!eventoId) return <p>Selecione um evento para gerenciar o FAQ.</p>;

  return (
    <div className={styles.managerContainer}>
      {errorMsg && (
        <p role="alert" style={{ color: '#c0392b', background: 'rgba(192,57,43,0.08)', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {errorMsg}
        </p>
      )}
      <form onSubmit={handleSubmit} className={styles.faqForm}>
        <h3>{editingId ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
        <input 
          type="text" 
          placeholder="Pergunta" 
          value={formData.pergunta} 
          onChange={(e) => setFormData({...formData, pergunta: e.target.value})}
          required
          className={styles.input}
        />
        <textarea 
          placeholder="Resposta" 
          value={formData.resposta} 
          onChange={(e) => setFormData({...formData, resposta: e.target.value})}
          required
          className={styles.textarea}
        />
        <input 
          type="number" 
          placeholder="Ordem" 
          value={formData.ordem} 
          onChange={(e) => setFormData({...formData, ordem: parseInt(e.target.value)})}
          className={styles.input}
        />
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn}>
            {editingId ? 'Atualizar' : 'Adicionar'}
          </button>
          {editingId && (
            <button type="button" onClick={() => {setEditingId(null); setFormData({pergunta:'', resposta:'', ordem:0})}}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.faqList}>
        <h3>Perguntas Atuais</h3>
        {loading ? <p>Carregando...</p> : faqs.map(faq => (
          <div key={faq.id} className={styles.faqItem}>
            <div>
              <strong>{faq.ordem}. {faq.pergunta}</strong>
              <p>{faq.resposta}</p>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(faq)}>Editar</button>
              <button onClick={() => handleDelete(faq.id)} className={styles.deleteBtn}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
