'use client';

import { useState, useEffect } from 'react';
import styles from './RSVP.module.css';
import Link from 'next/link';
import { rsvpService } from '@/lib/services/rsvpService';
import { Convite, ConviteMembro, RSVP as RSVPType } from '@/lib/types/database';

interface RSVPProps {
  inviteSlug?: string;
}

export default function RSVP({ inviteSlug: propSlug }: RSVPProps) {
  const [conviteEncontrado, setConviteEncontrado] = useState<Convite | null>(null);
  const [membros, setMembros] = useState<ConviteMembro[]>([]);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingRSVP, setExistingRSVP] = useState<RSVPType | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Busca convite por slug vindo da URL e configurações
  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        setLoading(true);
        
        // 1. Fetch Deadline
        const config = await rsvpService.getRSVPConfig();
        if (config?.prazo_rsvp) {
          const date = new Date(config.prazo_rsvp);
          setDeadline(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
        }

        // 2. Identificar Slug (Prop ou URL)
        const params = new URLSearchParams(window.location.search);
        const urlSlug = params.get('invite');
        const activeSlug = propSlug || urlSlug;

        if (activeSlug) {
          const data = await rsvpService.getInviteBySlug(activeSlug);
          if (data) {
            setConviteEncontrado(data);
            setFormData(prev => ({ ...prev, nome: data.nome_principal }));
            
            // 3. Fetch Config baseada no convite
            const config = await rsvpService.getRSVPConfig(data.id);
            if (config?.prazo_rsvp) {
              const date = new Date(config.prazo_rsvp);
              setDeadline(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
            }

            // 4. Buscar membros e RSVP existente
            const [members, rsvp] = await Promise.all([
              rsvpService.getInviteMembers(data.id),
              rsvpService.getExistingRSVP(data.id)
            ]);

            setMembros(members);
            if (rsvp) {
              setExistingRSVP(rsvp);
              setShowForm(false);
            } else {
              setShowForm(true);
            }
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
  }, [propSlug]);

  const toggleMembro = (id: string) => {
    setMembros(prev => prev.map(m => 
      m.id === id ? { ...m, confirmado: !m.confirmado } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const isRecusado = formData.confirmacao === 'nao';
    
    // Contagem de confirmados
    const countConfirmados = membros.length > 0 
      ? membros.filter(m => m.confirmado).length 
      : formData.quantidade;

    const isExcedente = !isRecusado && conviteEncontrado && countConfirmados > conviteEncontrado.limite_pessoas;
    
    let status = 'confirmado';
    if (isRecusado) status = 'recusado';
    else if (isExcedente) status = 'excedente_solicitado';

    // 1. Salvar RSVP consolidado
    const { success, error } = await rsvpService.submitRSVP({ 
      convite_id: conviteEncontrado?.id,
      confirmados: isRecusado ? 0 : countConfirmados,
      restricoes: isRecusado ? '' : formData.restricoes,
      mensagem: formData.mensagem,
      telefone: formData.telefone,
      status: status
    });

    if (success) {
      // 2. Salvar status individual dos membros se houver
      if (membros.length > 0) {
        try {
          await Promise.all(
            membros.map(m => rsvpService.updateMemberStatus(m.id, isRecusado ? false : !!m.confirmado))
          );
        } catch (err) {
          console.warn('Erro ao atualizar membros nominais, mas RSVP geral foi salvo.', err);
        }
      }
      setAlertaExcedente(!!isExcedente);
      setEnviado(true);
    } else {
      const msg = error?.message || '';
      if (msg.includes('violates row-level security') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden')) {
        setErrorMessage('Acesso não autorizado pelo banco de dados. Por favor, verifique as permissões de RLS.');
      } else {
        setErrorMessage('Houve um erro ao enviar sua confirmação. Tente novamente mais tarde.');
      }
      console.error(error);
    }
    setLoading(false);
  };

  if (conviteEncontrado && existingRSVP && !showForm) {
    const isRecusado = existingRSVP.status === 'recusado';
    const tipo = conviteEncontrado.tipo;

    return (
      <section className={styles.section} id="rsvp">
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>❤️</div>
          <h2 className="cursive">
            {isRecusado ? 'Olá novamente!' : 'Que bom te ver por aqui!'}
          </h2>
          <p>
            {isRecusado ? (
              'Você nos avisou que não poderá comparecer. Caso seus planos tenham mudado, será um prazer te receber!'
            ) : tipo === 'individual' ? (
              'Sua presença já está confirmada e estamos contando os dias para celebrar com você!'
            ) : tipo === 'casal' ? (
              'A presença de vocês já está confirmada! Mal podemos esperar para ver esse casal na pista.'
            ) : (
              'A presença da família já está confirmada! Será uma alegria imensa ver todos vocês reunidos.'
            )}
          </p>
          
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {!isRecusado && (
              <Link href={`/presentes?invite=${conviteEncontrado.slug}`} className={styles.primaryBtn}>
                Ver Lista de Presentes
              </Link>
            )}
            <button 
              onClick={() => setShowForm(true)} 
              className={styles.secondaryBtn}
              style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.6, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Mudei de ideia / Editar resposta
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (enviado) {
    const isRecusado = formData.confirmacao === 'nao';
    const tipo = conviteEncontrado?.tipo || 'individual';
    
    const SUCCESS_MESSAGES = {
      individual: {
        title: 'Sua presença está confirmada!',
        text: 'Ficamos muito felizes em saber que você virá celebrar conosco. Ter você por perto tornará nosso dia ainda mais especial!'
      },
      casal: {
        title: 'Presença confirmada!',
        text: 'É uma alegria imensa saber que vocês estarão lá. Ter um casal tão querido ao nosso lado torna tudo mais mágico!'
      },
      familia: {
        title: 'Família confirmada!',
        text: 'Não vemos a hora de ver vocês reunidos celebrando conosco! A presença da família é o que dá vida à nossa festa.'
      }
    };

    const currentMsg = isRecusado 
      ? { title: 'Poxa, que pena!', text: 'Sentiremos sua falta no nosso grande dia, mas agradecemos por nos avisar.' }
      : SUCCESS_MESSAGES[tipo as keyof typeof SUCCESS_MESSAGES] || { 
          title: 'Confirmado!', 
          text: 'Sua confirmação foi recebida. Mal podemos esperar para celebrar com você!' 
        };

    return (
      <section className={styles.section} id="rsvp">
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>❤️</div>
          <h2 className="cursive">{currentMsg.title}</h2>
          <p>{currentMsg.text}</p>
          {!isRecusado && (
            <Link href={`/presentes?invite=${conviteEncontrado?.slug}`} className={styles.primaryBtn} style={{ marginTop: '2rem', display: 'inline-block' }}>
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
              {conviteEncontrado.tipo === 'individual' ? (
                <p>Olá, <strong>{conviteEncontrado.nome_principal}</strong>! Preparamos um lugar com muito carinho para você.</p>
              ) : conviteEncontrado.tipo === 'casal' ? (
                <p>Olá, <strong>{conviteEncontrado.nome_principal}</strong>! Ficaremos radiantes em receber vocês dois.</p>
              ) : (
                <p>Olá, <strong>{conviteEncontrado.nome_principal}</strong>! Reservamos um espaço especial para sua família.</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmacao">
                {conviteEncontrado.tipo === 'individual' ? 'Você poderá celebrar conosco?' : 
                 conviteEncontrado.tipo === 'casal' ? 'Vocês poderão celebrar conosco?' : 
                 'Sua família poderá celebrar conosco?'}
              </label>
              <select 
                id="confirmacao"
                value={formData.confirmacao}
                onChange={(e) => setFormData({...formData, confirmacao: e.target.value})}
                className={styles.input}
              >
                <option value="sim">
                  {conviteEncontrado.tipo === 'individual' ? 'Sim, estarei lá!' : 'Sim, estaremos lá!'}
                </option>
                <option value="nao">
                  {conviteEncontrado.tipo === 'individual' ? 'Infelizmente não poderei ir' : 'Infelizmente não poderemos ir'}
                </option>
              </select>
            </div>

            {formData.confirmacao === 'sim' && conviteEncontrado.tipo !== 'individual' && (
              <>
                {membros && membros.length > 0 ? (
                  <div className={styles.fieldGroup}>
                    <label>
                      {conviteEncontrado.tipo === 'casal' ? 'Confirmem a presença de vocês:' : 'Quem da família virá celebrar conosco?'}
                    </label>
                    <div className={styles.membersList}>
                      {membros.map(membro => (
                        <div key={membro.id} className={styles.memberItem} onClick={() => toggleMembro(membro.id)}>
                          <div className={`${styles.checkbox} ${membro.confirmado ? styles.checked : ''}`}>
                            {membro.confirmado && <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span>{membro.nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
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
                  </div>
                )}
              </>
            )}

            {formData.confirmacao === 'sim' && (
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

            {errorMessage && (
              <div className={styles.errorMessage}>
                {errorMessage}
              </div>
            )}

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Enviando carinho...' : 'Confirmar Presença'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
