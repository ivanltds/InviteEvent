'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminConvidados.module.css';
import { inviteService, InviteWithRSVP } from '@/lib/services/inviteService';
import { InviteType, Configuracao } from '@/lib/types/database';
import { generateWhatsappLink } from '@/lib/utils/whatsapp';
import { configService } from '@/lib/services/configService';
import { useEvent } from '@/lib/contexts/EventContext';

export default function AdminConvidados() {
  const { currentEvent, loading: eventLoading } = useEvent();
  const [invites, setInvites] = useState<InviteWithRSVP[]>([]);
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvite, setEditingInvite] = useState<InviteWithRSVP | null>(null);
  const [formData, setFormData] = useState({
    nome_principal: '',
    limite_pessoas: 1,
    tipo: 'individual' as InviteType,
    telefone: ''
  });
  const [members, setMembers] = useState<{ id?: string; nome: string }[]>([]);

  // Controles de Modais e Toasts Novos
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRSVPState, setConfirmRSVPState] = useState<{invite: InviteWithRSVP, status: 'confirmado' | 'recusado'} | null>(null);
  const [infoRSVP, setInfoRSVP] = useState<{mensagem?: string | null, restricoes?: string | null} | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const fetchData = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const [allInvites, configData] = await Promise.all([
      inviteService.getAllInvites(currentEvent.id),
      configService.getConfig(currentEvent.id)
    ]);
    setInvites(allInvites);
    setConfig(configData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentEvent]);

  const handleSendWhatsapp = (invite: InviteWithRSVP) => {
    if (!config) return;
    
    // Prioriza o telefone do convite (cadastrado pelo admin)
    // Se não houver, tenta o do RSVP (preenchido pelo convidado)
    const rsvp = invite.rsvp && invite.rsvp[0];
    const telefone = invite.telefone || rsvp?.telefone || '';
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/inv/${invite.slug}`;
    
    const url = generateWhatsappLink(
      telefone, 
      config.whatsapp_template || '', 
      { nome: invite.nome_principal, link }
    );
    
    window.open(url, '_blank');
  };

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    const slug = inviteService.generateObfuscatedSlug(formData.nome_principal);

    const { success, error } = await inviteService.createInvite({
      ...formData,
      evento_id: currentEvent.id,
      slug
    });

    if (success) {
      // Buscar o convite recém criado para obter o ID
      const all = await inviteService.getAllInvites(currentEvent.id);
      const newInvite = all.find(i => i.slug === slug);
      
      if (newInvite && members.length > 0) {
        await inviteService.saveMembers(newInvite.id, members);
      }

      setIsAdding(false);
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual', telefone: '' });
      setMembers([]);
      fetchData();
    } else {
      alert('Erro ao criar convite: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleUpdateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvite) return;

    const { success, error } = await inviteService.updateInvite(editingInvite.id, formData);

    if (success) {
      if (members.length > 0) {
        await inviteService.saveMembers(editingInvite.id, members);
      }
      setEditingInvite(null);
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual', telefone: '' });
      setMembers([]);
      fetchData();
    } else {
      alert('Erro ao atualizar convite: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteInvite = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const { success, error } = await inviteService.deleteInvite(confirmDeleteId);
    setConfirmDeleteId(null);
    if (success) {
      fetchData();
      triggerToast('Convite excluído com sucesso.');
    } else {
      triggerToast('Erro ao excluir: ' + (error?.message || 'Tente novamente'));
    }
  };

  const startEdit = (invite: InviteWithRSVP) => {
    setEditingInvite(invite);
    setFormData({
      nome_principal: invite.nome_principal,
      limite_pessoas: invite.limite_pessoas,
      tipo: invite.tipo,
      telefone: invite.telefone || ''
    });
    setMembers(invite.membros || []);
  };

  const addMemberField = () => {
    setMembers([...members, { nome: '' }]);
  };

  const removeMemberField = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMemberName = (index: number, name: string) => {
    const newMembers = [...members];
    newMembers[index].nome = name;
    setMembers(newMembers);
  };

  const handleManualRSVP = (invite: InviteWithRSVP, status: 'confirmado' | 'recusado') => {
    setConfirmRSVPState({ invite, status });
  };

  const executeManualRSVP = async () => {
    if (!confirmRSVPState) return;
    const { invite, status } = confirmRSVPState;
    const confirmados = status === 'confirmado' ? invite.limite_pessoas : 0;
    const { success, error } = await inviteService.updateRSVPManually(invite.id, confirmados, status);
    setConfirmRSVPState(null);
    if (success) {
      fetchData();
      triggerToast(`RSVP forçado para ${status.toUpperCase()} com sucesso.`);
    } else {
      triggerToast('Erro ao atualizar RSVP.');
    }
  };

  const copyInviteLink = (slug: string) => {
    const url = `${window.location.origin}/inv/${slug}`;
    navigator.clipboard.writeText(url);
    triggerToast('Link copiado para o clipboard!');
  };

  const getStats = () => {
    const calculated = inviteService.calculateDashboardStats(invites);
    return { 
      totalConvites: calculated.convitesRespondidos, 
      totalPessoas: calculated.pessoasConfirmadas, 
      excedentes: calculated.excedentes 
    };
  };

  const stats = getStats();

  const exportToCSV = () => {
    const headers = ['Convite Principal', 'Nome do Membro', 'Confirmado', 'Tipo', 'Restrições Alimentares', 'Mensagem', 'Telefone'];
    const rows: string[] = [];

    invites.forEach(i => {
      const rsvp = i.rsvp && i.rsvp[0];
      
      // Se houver membros nominais, exporta um por linha
      if (i.membros && i.membros.length > 0) {
        i.membros.forEach(m => {
          rows.push([
            `"${i.nome_principal}"`,
            `"${m.nome}"`,
            m.confirmado === true ? 'Sim' : m.confirmado === false ? 'Não' : 'Pendente',
            `"${i.tipo}"`,
            `"${rsvp?.restricoes || ''}"`,
            `"${rsvp?.mensagem || ''}"`,
            `"${rsvp?.telefone || ''}"`
          ].join(','));
        });
      } else {
        // Fallback para convites sem membros nominais
        rows.push([
          `"${i.nome_principal}"`,
          'N/A',
          rsvp ? (rsvp.confirmados > 0 ? 'Sim' : 'Não') : 'Pendente',
          `"${i.tipo}"`,
          `"${rsvp?.restricoes || ''}"`,
          `"${rsvp?.mensagem || ''}"`,
          `"${rsvp?.telefone || ''}"`
        ].join(','));
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lista_convidados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (eventLoading || (loading && currentEvent)) return <div className={styles.loading}>Carregando convidados...</div>;

  if (!currentEvent) {
    return (
      <main className={styles.adminMain}>
        <h1>Convidados</h1>
        <p>Selecione um evento para gerenciar os convidados.</p>
      </main>
    );
  }

  return (
    <main className={styles.adminMain}>
      <header className={styles.adminHeader}>
        <h1>Gestão de Convidados: {currentEvent.nome}</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={exportToCSV}>Exportar CSV</button>
          <button className={styles.addBtn} onClick={() => setIsAdding(true)}>Novo Convite</button>
          <button className={styles.refreshBtn} onClick={fetchData}>Atualizar Lista</button>
        </div>
      </header>

      {(isAdding || editingInvite) && (
        <section className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={editingInvite ? handleUpdateInvite : handleAddInvite}>
            <h2>{editingInvite ? 'Editar Convite' : 'Novo Convite'}</h2>
            <div className={styles.fieldGroup}>
              <label htmlFor="inviteName">Nome do Convite (Ex: Família Silva)</label>
              <input 
                id="inviteName"
                type="text" 
                required 
                value={formData.nome_principal}
                onChange={(e) => setFormData({...formData, nome_principal: e.target.value})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="telefone">Telefone (WhatsApp)</label>
              <input 
                id="telefone"
                type="tel" 
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="type">Tipo</label>
              <select 
                id="type"
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value as InviteType})}
              >
                <option value="individual">Individual</option>
                <option value="casal">Casal</option>
                <option value="familia">Família</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="limit">Limite de Pessoas (Capacidade do Convite)</label>
              <input 
                id="limit"
                type="number" 
                min="1"
                required 
                value={formData.limite_pessoas}
                onChange={(e) => setFormData({...formData, limite_pessoas: parseInt(e.target.value) || 1})}
              />
              <p className={styles.extraHint}>Define quantas pessoas este convite cobre originalmente.</p>
            </div>

            <div className={styles.fieldGroup}>
              <label>Membros Nominais (Opcional - Para confirmação individual)</label>
              <div className={styles.membersManager}>
                {members.map((member, index) => (
                  <div key={index} className={styles.memberRow}>
                    <input 
                      type="text" 
                      placeholder="Nome do membro"
                      value={member.nome}
                      onChange={(e) => updateMemberName(index, e.target.value)}
                      className={styles.memberInput}
                    />
                    <button type="button" className={styles.removeMemberBtn} onClick={() => removeMemberField(index)}>&times;</button>
                  </div>
                ))}
                <button type="button" className={styles.addMemberBtn} onClick={() => {
                  addMemberField();
                  // Sincroniza o limite se houver mais membros que o limite atual
                  if (members.length + 1 > formData.limite_pessoas) {
                    setFormData(prev => ({ ...prev, limite_pessoas: members.length + 1 }));
                  }
                }}>
                  + Adicionar Membro
                </button>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn}>
                {editingInvite ? 'Salvar Alterações' : 'Criar Convite'}
              </button>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => {
                  setIsAdding(false);
                  setEditingInvite(null);
                  setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual', telefone: '' });
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Confirmados (Pessoas)</h3>
          <p className={styles.statNumber}>{stats.totalPessoas}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Convites Respondidos</h3>
          <p className={styles.statNumber}>{stats.totalConvites}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Excedentes</h3>
          <p className={`${styles.statNumber} ${stats.excedentes > 0 ? styles.alert : ''}`}>
            {stats.excedentes}
          </p>
        </div>
      </section>

      <section className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loading}>Carregando convidados...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Convidado</th>
                <th>Tipo</th>
                <th>Confirmação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                // Tenta pegar o RSVP do array 'rsvp' (alias ou join padrão)
                const rsvpArray = (invite as any).rsvp;
                const rsvp = Array.isArray(rsvpArray) ? rsvpArray[0] : rsvpArray;
                
                return (
                  <tr key={invite.id}>
                    <td>
                      <div className={styles.guestInfo}>
                        <span className={styles.guestName}>{invite.nome_principal}</span>
                        <span className={styles.guestDate}>
                          Cadastrado em: {invite.created_at ? new Date(invite.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>{invite.tipo}</td>
                    <td>
                      {rsvp ? (
                        <span className={`${styles.statusBadge} ${styles[rsvp.status] || styles.confirmado}`}>
                          {rsvp.confirmados} confirmados
                          {rsvp.status === 'excedente_solicitado' && ' (Solicitado)'}
                        </span>
                      ) : (
                        <span className={styles.pendingBadge}>Pendente</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button 
                          className={styles.whatsappBtn} 
                          onClick={() => handleSendWhatsapp(invite)}
                          data-tooltip="Enviar via WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </button>
                        
                        <button 
                          className={styles.copyBtn} 
                          onClick={() => copyInviteLink(invite.slug)}
                          data-tooltip="Copiar Link"
                          data-invite-slug={invite.slug}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>

                        <button 
                          className={styles.editBtn} 
                          onClick={() => startEdit(invite)}
                          data-tooltip="Editar Convite"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>

                        <button 
                          className={styles.deleteBtn} 
                          onClick={() => handleDeleteInvite(invite.id)}
                          data-tooltip="Excluir"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>

                        {!rsvp && (
                          <>
                            <button 
                              className={styles.successBtn} 
                              onClick={() => handleManualRSVP(invite, 'confirmado')}
                              data-tooltip="Confirmar Manualmente"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </button>
                            <button 
                              className={styles.deleteBtn} 
                              style={{backgroundColor: 'transparent'}} 
                              onClick={() => handleManualRSVP(invite, 'recusado')}
                              data-tooltip="Recusar Manualmente"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            </button>
                          </>
                        )}
                        
                        {rsvp && (
                          <button 
                            className={styles.detailBtn} 
                            onClick={() => setInfoRSVP({ mensagem: rsvp.mensagem, restricoes: rsvp.restricoes })}
                            data-tooltip="Ver Informações"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>Nenhum convite cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal Excluir Convite */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={styles.modal}
              style={{ maxWidth: '380px', textAlign: 'center' }}
            >
              <h2 style={{ color: 'var(--admin-danger)', marginBottom: '1rem' }}>Excluir Convite</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Esta ação é definitiva e removerá o convite permanentemente.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={executeConfirmDelete}>Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal RSVP Manual */}
      <AnimatePresence>
        {confirmRSVPState && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={styles.modal}
              style={{ maxWidth: '400px', textAlign: 'center' }}
            >
              <h2 style={{ marginBottom: '1rem' }}>Alterar RSVP</h2>
              <p style={{ color: '#64748b', margin: '0 0 2rem 0' }}>
                Deseja forçar o RSVP de <strong>{confirmRSVPState.invite.nome_principal}</strong> para <strong>{confirmRSVPState.status.toUpperCase()}</strong>?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className={styles.cancelBtn} onClick={() => setConfirmRSVPState(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={executeManualRSVP}>Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Info (Mensagens e Restrições) */}
      <AnimatePresence>
        {infoRSVP && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={styles.modal}
              style={{ maxWidth: '450px' }}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Informações do RSVP</h2>
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b' }}>Mensagem dos Convidados</strong>
                <p style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginTop: '0.5rem', color: '#1e293b', border: '1px solid #f1f5f9' }}>
                  {infoRSVP.mensagem || 'Nenhuma mensagem enviada.'}
                </p>
              </div>
              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#ef4444' }}>Restrições Alimentares</strong>
                <p style={{ padding: '1rem', background: '#fef2f2', borderRadius: '12px', marginTop: '0.5rem', color: '#b91c1c', border: '1px solid #fee2e2' }}>
                  {infoRSVP.restricoes || 'Nenhuma restrição relatada.'}
                </p>
              </div>
              <button className={styles.cancelBtn} style={{ width: '100%' }} onClick={() => setInfoRSVP(null)}>Fechar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={styles.toast}
          >
            <div className={styles.toastIcon}>i</div>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
