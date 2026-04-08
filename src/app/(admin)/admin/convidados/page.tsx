'use client';

import { useState, useEffect } from 'react';
import styles from './AdminConvidados.module.css';
import { inviteService, InviteWithRSVP } from '@/lib/services/inviteService';

export default function AdminConvidados() {
  const [invites, setInvites] = useState<InviteWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvite, setEditingInvite] = useState<InviteWithRSVP | null>(null);
  const [formData, setFormData] = useState({
    nome_principal: '',
    limite_pessoas: 1,
    tipo: 'individual'
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await inviteService.getAllInvites();
    setInvites(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = inviteService.generateObfuscatedSlug(formData.nome_principal);

    const { success, error } = await inviteService.createInvite({
      ...formData,
      slug
    });

    if (success) {
      setIsAdding(false);
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual' });
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
      setEditingInvite(null);
      setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual' });
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
      tipo: invite.tipo
    });
  };

  const copyInviteLink = (slug: string) => {
    const url = `${window.location.origin}/inv/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para o clipboard!');
  };

  const getStats = () => {
    const totalConvites = invites.filter(i => i.rsvp && i.rsvp.length > 0).length;
    const totalPessoas = invites.reduce((acc, curr) => {
      const rsvp = curr.rsvp && curr.rsvp[0];
      return acc + (rsvp?.confirmados || 0);
    }, 0);
    
    const excedentes = invites.reduce((acc, curr) => {
      const rsvp = curr.rsvp && curr.rsvp[0];
      if (rsvp?.status === 'excedente_solicitado') {
        return acc + (rsvp.confirmados - curr.limite_pessoas);
      }
      return acc;
    }, 0);

    return { totalConvites, totalPessoas, excedentes };
  };

  const stats = getStats();

  const exportToCSV = () => {
    const headers = ['Nome', 'Tipo', 'Limite', 'Status', 'Confirmados', 'Mensagem'];
    const rows = invites.map(i => {
      const rsvp = i.rsvp && i.rsvp[0];
      return [
        i.nome_principal,
        i.tipo,
        i.limite_pessoas,
        rsvp?.status || 'Pendente',
        rsvp?.confirmados || 0,
        rsvp?.mensagem || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'lista_convidados.csv');
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
              <label htmlFor="limit">Limite de Pessoas</label>
              <input 
                id="limit"
                type="number" 
                min="1"
                required 
                value={formData.limite_pessoas}
                onChange={(e) => setFormData({...formData, limite_pessoas: parseInt(e.target.value)})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="type">Tipo</label>
              <select 
                id="type"
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="individual">Individual</option>
                <option value="casal">Casal</option>
                <option value="familia">Família</option>
              </select>
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
                  setFormData({ nome_principal: '', limite_pessoas: 1, tipo: 'individual' });
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
                <th>Limite</th>
                <th>RSVP</th>
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
                    <td>{invite.limite_pessoas}</td>
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
