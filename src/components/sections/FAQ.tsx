'use client';

import { useState, useEffect } from 'react';
import styles from "./FAQ.module.css";
import { supabase } from '@/lib/supabase';

const DEFAULT_FAQS = [
  {
    question: "Crianças podem ir?",
    answer: "Sim! Crianças são muito bem-vindas em nosso casamento."
  },
  {
    question: "Qual o traje do casamento?",
    answer: "O traje sugerido é Esporte Fino. Queremos que todos estejam elegantes, mas confortáveis para aproveitar a festa."
  },
  {
    question: "Até quando devo confirmar minha presença?",
    answer: "Por favor, confirme sua presença o quanto antes, para que possamos organizar tudo com perfeição."
  },
  {
    question: "Haverá lista de presentes?",
    answer: "Sim! Temos uma lista de presentes aqui mesmo no site. Você pode acessá-la através do link que enviamos no seu convite."
  }
];

export default function FAQ({ eventoId }: { eventoId?: string }) {
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        if (!eventoId) {
          setFaqs(DEFAULT_FAQS);
          return;
        }

        const { data, error } = await supabase
          .from('faq')
          .select('pergunta, resposta')
          .eq('evento_id', eventoId)
          .order('ordem', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setFaqs(data.map((item: any) => ({
            question: item.pergunta,
            answer: item.resposta
          })));
        } else {
          setFaqs(DEFAULT_FAQS);
        }
      } catch (e) {
        console.error('Erro ao buscar FAQs (usando fallback):', e);
        setFaqs(DEFAULT_FAQS);
      }
    }
    fetchFaqs();
  }, [eventoId]);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section} id="faq">
      <div className={styles.container}>
        <h2 className="cursive">Perguntas Frequentes</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
            >
              <button 
                className={styles.question} 
                onClick={() => toggleFaq(index)}
              >
                {faq.question}
                <span className={styles.icon}>{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className={styles.answer}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
