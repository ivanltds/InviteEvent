'use client';

import { useState, useEffect } from 'react';
import styles from './RSVP.module.css';
import Link from 'next/link';
import { rsvpService } from '@/lib/services/rsvpService';
import { Convite } from '@/lib/types/database';

export default function RSVP() {
  const [conviteEncontrado, setConviteEncontrado] = useState<Convite | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    confirmacao: 'sim',
    quantidade: 1,
    restricoes: '',
    mensagem: '',
    telefone: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [alertaExcedente, setAlertaExcedente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadline] = useState('13 de Maio de 2026');
  const [noInviteFound, setNoInviteFound] = useState(false);

  // Busca convite por slug vindo da URL e configurações
  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        // Fetch Deadline
        setLoading(true);
        const config = await rsvpService.getRSVPConfig();
        if (config?.prazo_rsvp) {
          const date = new Date(config.prazo_rsvp);
          setDeadline(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
        }

        const params = new URLSearchParams(window.location.search);
        const inviteSlug = params.get('invite');
        if (inviteSlug) {
          const data = await rsvpService.getInviteBySlug(inviteSlug);
          if (data) {
            setConviteEncontrado(data);
            setFormData(prev => ({ ...prev, nome: data.nome_principal }));
            setNoInviteFound(false);
          } else {
            setNoInviteFound(true);
          }
        } else {
          setNoInviteFound(true);
        }
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const isRecusado = formData.confirmacao === 'nao';
    const isExcedente = !isRecusado && conviteEncontrado && formData.quantidade > conviteEncontrado.limite_pessoas;
    
    let status = 'confirmado';
    if (isRecusado) status = 'recusado';
    else if (isExcedente) status = 'excedente_solicitado';

    const { success, error } = await rsvpService.submitRSVP({ 
      convite_id: conviteEncontrado?.id,
      confirmados: isRecusado ? 0 : formData.quantidade,
      restricoes: isRecusado ? '' : formData.restricoes,
      mensagem: formData.mensagem,
      telefone: formData.telefone,
      status: status
    });

    if (success) {
      setAlertaExcedente(!!isExcedente);
      setEnviado(true);
    } else {
      alert('Erro ao enviar confirmação. Verifique sua conexão ou tente novamente mais tarde.');
      console.error(error);
    }
    setLoading(false);
  };

  if (enviado) {
    const isRecusado = formData.confirmacao === 'nao';
    return (
      <section className={styles.section} id="rsvp">
        <div className={styles.successContainer}>
          <h2 className="cursive">{isRecusado ? 'Poxa, que pena!' : 'Confirmado!'}</h2>
          <p>
            {isRecusado 
              ? 'Sentiremos sua falta no nosso grande dia, mas agradecemos por nos avisar.' 
              : 'Sua confirmação foi recebida. Mal podemos esperar para celebrar com você!'}
          </p>
          {!isRecusado && (
            <Link href="/presentes" className={styles.primaryBtn} style={{ marginTop: '2rem', display: 'inline-block' }}>
              Ver Lista de Presentes
            </Link>
          )}
          {alertaExcedente && !isRecusado && (
            <p className={styles.excedenteMsg}>
              Ficamos muito felizes em saber que mais pessoas querem celebrar conosco! Como nosso espaço foi planejado com carinho para um número específico, vamos conferir a disponibilidade e entraremos em contato com você em breve.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="rsvp">
      <div className={styles.container}>
        <h2 className="cursive">Vamos celebrar juntos?</h2>
        <p className={styles.deadline}>Por favor, nos conte se você vem até {deadline}</p>

        {loading ? (
          <div className={styles.searchBox}>
            <p>Carregando convite...</p>
          </div>
        ) : noInviteFound ? (
          <div className={styles.searchBox}>
            <p><strong>Acesso Restrito</strong></p>
            <p style={{ marginTop: '1rem', opacity: 0.8 }}>
              Para confirmar sua presença, utilize o link individual enviado pelos noivos.
            </p>
          </div>
        ) : conviteEncontrado && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.conviteInfo}>
              <p>Olá, <strong>{conviteEncontrado.nome_principal}</strong>!</p>
              <p>Reservamos <strong>{conviteEncontrado.limite_pessoas} {conviteEncontrado.limite_pessoas === 1 ? 'vaga' : 'vagas'}</strong> para o seu grupo.</p>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmacao">Pode confirmar sua presença?</label>
              <select 
                id="confirmacao"
                value={formData.confirmacao}
                onChange={(e) => setFormData({...formData, confirmacao: e.target.value})}
                className={styles.input}
              >
                <option value="sim">Sim, com certeza!</option>
                <option value="nao">Infelizmente não poderei ir</option>
              </select>
            </div>

            {formData.confirmacao === 'sim' && (
              <>
                <div className={styles.fieldGroup}>
                  <label htmlFor="quantidade">Quantas pessoas do seu grupo virão?</label>
                  <input 
                    id="quantidade"
                    type="number" 
                    min="1" 
                    max="10"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value)})}
                    className={styles.input}
                  />
                  {formData.quantidade > conviteEncontrado.limite_pessoas && (
                    <p className={styles.warning}>Essa quantidade é um pouquinho maior do que o planejado, mas vamos tentar acomodar todos!</p>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="restricoes">Alguma restrição alimentar que devemos saber?</label>
                  <textarea 
                    id="restricoes"
                    placeholder="Ex: Alergias, intolerâncias, opção vegetariana..."
                    value={formData.restricoes}
                    onChange={(e) => setFormData({...formData, restricoes: e.target.value})}
                    className={styles.input}
                  />
                </div>
              </>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="mensagem">Quer deixar um recadinho para os noivos?</label>
              <textarea 
                id="mensagem"
                placeholder="Escreva algo carinhoso..."
                value={formData.mensagem}
                onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Enviando carinho...' : 'Confirmar Presença'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
