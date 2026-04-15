'use client';

import { useState, useEffect } from 'react';
import styles from './RSVP.module.css';
import Link from 'next/link';
import { rsvpService } from '@/lib/services/rsvpService';
import { Convite, ConviteMembro, RSVP as RSVPType, Configuracao } from '@/lib/types/database';
import { triggerCelebration, triggerSideCannons } from '@/lib/utils/confetti';

interface RSVPProps {
  inviteSlug?: string;
  config?: Configuracao;
}

export default function RSVP({ inviteSlug: propSlug, config: propConfig }: RSVPProps) {
  const [conviteEncontrado, setConviteEncontrado] = useState<Convite | null>(null);
  const [membros, setMembros] = useState<ConviteMembro[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    confirmacao: 'sim',
    quantidade: 1,
    extraGuests: 0,
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

  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        setLoading(true);
        
        const config = await rsvpService.getRSVPConfig();
        if (config?.prazo_rsvp) {
          const date = new Date(config.prazo_rsvp);
          setDeadline(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
        }

        const params = new URLSearchParams(window.location.search);
        const urlSlug = params.get('invite');
        const activeSlug = propSlug || urlSlug;

        if (activeSlug) {
          const data = await rsvpService.getInviteBySlug(activeSlug);
          if (data) {
            setConviteEncontrado(data);
            setFormData(prev => ({ ...prev, nome: data.nome_principal }));
            
            const config = await rsvpService.getRSVPConfig(data.id);
            if (config?.prazo_rsvp) {
              const date = new Date(config.prazo_rsvp);
              setDeadline(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
            }

            const [members, rsvp] = await Promise.all([
              rsvpService.getInviteMembers(data.id),
              rsvpService.getExistingRSVP(data.id)
            ]);

            // Se for um convite individual e não houver membros na tabela, criamos um membro virtual para UX consistente
            if (members.length === 0 && data.tipo === 'individual') {
               setMembros([{ id: 'virtual', nome: data.nome_principal, confirmado: true, convite_id: data.id } as any]);
            } else {
               setMembros(members);
            }

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

  const handleMemberRestriction = (id: string, value: string) => {
    setMembros(prev => prev.map(m => 
      m.id === id ? { ...m, restricoes: value } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const isRecusado = formData.confirmacao === 'nao';
    
    // Contagem de confirmados nominais (STORY-053 FIX)
    let countConfirmados = 0;
    if (isRecusado) {
      countConfirmados = 0;
    } else if (membros.length > 0) {
      // Soma membros marcados + convidados extras informados
      countConfirmados = membros.filter(m => m.confirmado).length + formData.extraGuests;
    } else {
      countConfirmados = formData.quantidade;
    }

    const isExcedente = !isRecusado && conviteEncontrado && countConfirmados > conviteEncontrado.limite_pessoas;
    
    let status = 'confirmado';
    if (isRecusado) status = 'recusado';
    else if (isExcedente) status = 'excedente_solicitado';

    // STORY-053: RSVP Individual e Atômico
    const rsvpPayload = { 
      convite_id: conviteEncontrado?.id,
      evento_id: conviteEncontrado?.evento_id,
      confirmados: countConfirmados,
      restricoes: formData.restricoes, // Mantemos o global para compatibilidade
      mensagem: formData.mensagem,
      telefone: formData.telefone,
      status: status
    };

    const membersPayload = membros.map(m => ({
      id: m.id === 'virtual' ? undefined : m.id,
      nome: m.nome,
      confirmado: isRecusado ? false : !!m.confirmado,
      restricoes: m.restricoes || ''
    }));

    const { success, error } = await rsvpService.submitFullRSVP(rsvpPayload, membersPayload);

    if (success) {
      setAlertaExcedente(!!isExcedente);
      setEnviado(true);

      if (!isRecusado) {
        const themeColor = propConfig?.accent_color || '#D4AF37';
        triggerCelebration([themeColor, '#ffffff', '#F5E6CC']);
        setTimeout(() => triggerSideCannons(3, [themeColor, '#ffffff']), 800);
      }
    } else {
      setErrorMessage('Houve um erro ao enviar sua confirmação. Tente novamente mais tarde.');
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
          <h2 className="cursive" style={{ color: propConfig?.accent_color }}>
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
              <Link href={`/presentes?invite=${conviteEncontrado.slug}`} className={styles.primaryBtn} style={{ backgroundColor: propConfig?.accent_color }}>
                Ver Lista de Presentes
              </Link>
            )}
            <button 
              onClick={() => setShowForm(true)} 
              className={styles.resetBtn}
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
          <h2 className="cursive" style={{ color: propConfig?.accent_color }}>{currentMsg.title}</h2>
          <p>{currentMsg.text}</p>
          {!isRecusado && (
            <Link href={`/presentes?invite=${conviteEncontrado?.slug}`} className={styles.primaryBtn} style={{ marginTop: '2rem', display: 'inline-block', backgroundColor: propConfig?.accent_color }}>
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
        <h2 className="cursive" style={{ color: propConfig?.accent_color }}>Vamos celebrar juntos?</h2>
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
            <div className={styles.conviteInfo} style={{ borderLeftColor: propConfig?.accent_color }}>
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

            {formData.confirmacao === 'sim' && (
              <>
                <div className={styles.fieldGroup}>
                  <label>
                    {conviteEncontrado.tipo === 'individual' ? 'Confirme seus dados:' : 
                     conviteEncontrado.tipo === 'casal' ? 'Quem de vocês poderá ir?' : 
                     'Quem da família virá celebrar conosco?'}
                  </label>
                  <div className={styles.membersList}>
                    {membros.map(membro => (
                      <div key={membro.id} className={styles.memberItem}>
                        <div className={styles.memberHeader} onClick={() => toggleMembro(membro.id)}>
                          <div 
                            className={`${styles.checkbox} ${membro.confirmado ? styles.checked : ''}`}
                            style={membro.confirmado ? { backgroundColor: propConfig?.accent_color, borderColor: propConfig?.accent_color } : {}}
                          >
                            {membro.confirmado && <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span>{membro.nome}</span>
                        </div>
                        
                        {membro.confirmado && (
                          <div className={styles.memberRestriction}>
                            <input 
                              type="text"
                              className={styles.memberInput}
                              placeholder="Restrição alimentar? (Ex: Vegano, s/ glúten)"
                              value={membro.restricoes || ''}
                              onChange={(e) => handleMemberRestriction(membro.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="extraGuests">Gostaria de levar mais alguém não listado acima?</label>
                  <div className={styles.extraGuestsControl}>
                    <button 
                      type="button" 
                      className={styles.qtyBtn} 
                      onClick={() => setFormData(prev => ({ ...prev, extraGuests: Math.max(0, prev.extraGuests - 1) }))}
                    >
                      -
                    </button>
                    <span className={styles.extraQty}>{formData.extraGuests}</span>
                    <button 
                      type="button" 
                      className={styles.qtyBtn} 
                      onClick={() => setFormData(prev => ({ ...prev, extraGuests: prev.extraGuests + 1 }))}
                    >
                      +
                    </button>
                    <span className={styles.extraLabel}>pessoa(s) extra(s)</span>
                  </div>
                  <p className={styles.extraHint}>
                    Sinalize aqui se precisar adicionar acompanhantes. O organizador será avisado para conferir a disponibilidade.
                  </p>
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

            {errorMessage && (
              <div className={styles.errorMessage}>
                {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.primaryBtn} 
              disabled={loading}
              style={{ backgroundColor: propConfig?.accent_color }}
            >
              {loading ? 'Enviando carinho...' : 'Confirmar Presença'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
