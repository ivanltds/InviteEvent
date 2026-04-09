'use client';

import { useState, useEffect } from 'react';
import styles from './AdminConvidados.module.css';
import { inviteService, InviteWithRSVP } from '@/lib/services/inviteService';
import { InviteType, Configuracao } from '@/lib/types/database';
import { generateWhatsappLink } from '@/lib/utils/whatsapp';
import { configService } from '@/lib/services/configService';

export default function AdminConvidados() {
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

  const fetchData = async () => {
    setLoading(true);
    const [allInvites, configData] = await Promise.all([
      inviteService.getAllInvites(),
      configService.getConfig()
    ]);
    setInvites(allInvites);
    setConfig(configData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const slug = inviteService.generateObfuscatedSlug(formData.nome_principal);

    const { success, error } = await inviteService.createInvite({
      ...formData,
      slug
    });

    if (success) {
      // Buscar o convite recém criado para obter o ID
      const all = await inviteService.getAllInvites();
      const newInvite = all.find(i => i.slug === slug);
      
      if (newInvite && members.length > 0) {
        await inviteService.saveMembers(newInvite.id, members);
      }

      setIsAdding(false);
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual' });
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
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual' });
      setMembers([]);
      fetchData();
    } else {
      alert('Erro ao atualizar convite: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (confirm('Deseja realmente excluir este convite?')) {
      const { success, error } = await inviteService.deleteInvite(id);
      if (success) {
        fetchData();
      } else {
        alert('Erro ao excluir: ' + error?.message);
      }
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

  const copyInviteLink = (slug: string) => {
    const url = `${window.location.origin}/inv/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para o clipboard!');
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

  return (
    <main className={styles.adminMain}>
      <header className={styles.adminHeader}>
        <h1>Gestão de Convidados</h1>
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
                <button type="button" className={styles.addMemberBtn} onClick={addMemberField}>
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
                const rsvp = invite.rsvp && invite.rsvp[0];
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
                        <span className={`${styles.statusBadge} ${styles[rsvp.status]}`}>
                          {rsvp.confirmados} confirmados
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
                          title="Enviar convite via WhatsApp"
                        >
                          Whats
                        </button>
                        <button className={styles.copyBtn} onClick={() => copyInviteLink(invite.slug)}>
                          Link
                        </button>
                        <button className={styles.editBtn} onClick={() => startEdit(invite)}>
                          Editar
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteInvite(invite.id)}>
                          Excluir
                        </button>
                        {rsvp && (
                          <button className={styles.detailBtn} onClick={() => alert(`Mensagem: ${rsvp.mensagem || 'Nenhuma'}\nRestrições: ${rsvp.restricoes || 'Nenhuma'}`)}>
                            Info
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
    </main>
  );
}
