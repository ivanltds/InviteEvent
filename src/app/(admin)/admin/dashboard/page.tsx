'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingWizard from '@/components/admin/OnboardingWizard';

export default function DashboardPage() {
  const router = useRouter();
  const { currentEvent, events, setCurrentEvent, refreshEvents, loading: contextLoading, userProfile } = useEvent();

  const [isCreating, setIsCreating] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [eventName, setEventName] = useState('');
  const [stats, setStats] = useState({ totalConvites: 0, totalConfirmados: 0, totalPessoasPossiveis: 0, valorPresentes: 0 });
  const [recentRSVPs, setRecentRSVPs] = useState<any[]>([]);
  const [activating, setActivating] = useState(false);

  // Estados para Gestão Centralizada (Antigo EventosManager)
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string>>({});
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ nome: '', slug: '' });
  
  // Controle de Confirmação de Exclusão e Notificações
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Estados e Lógica para Lixeira (Soft Delete)
  const [deletedEvents, setDeletedEvents] = useState<any[]>([]);
  const [showTrash, setShowTrash] = useState(false);

  const fetchDeleted = async () => {
    const list = await eventService.getDeletedEvents();
    setDeletedEvents(list);
  };

  const isMaster = !!userProfile?.is_master;

  // Carregar papéis por evento para definir permissão de edição na plataforma
  useEffect(() => {
    async function fetchRoles() {
      if (currentEvent) return; // Não precisa carregar no modo operacional
      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user) return;

      const { data } = await supabase
        .from('evento_organizadores')
        .select('evento_id, role')
        .eq('user_id', userResp.user.id);
      
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(item => {
          map[item.evento_id] = item.role;
        });
        setUserRolesMap(map);
      }
    }
    fetchRoles();
  }, [events, currentEvent]);

  useEffect(() => {
    if (currentEvent && !currentEvent.onboarding_completed) {
      setShowWizard(true);
    } else {
      setShowWizard(false);
    }
  }, [currentEvent]);

  // Recarrega a lixeira sempre que carregar a listagem principal
  useEffect(() => {
    if (!currentEvent) {
      fetchDeleted();
    }
  }, [currentEvent, events]);

  useEffect(() => {
    async function fetchData() {
      if (!currentEvent) return;
      const s = await eventService.getEventStats(currentEvent.id);
      setStats(s);
      
      const { data: rsvps } = await supabase
        .from('rsvp')
        .select('*, convites(nome_principal)')
        .eq('evento_id', currentEvent.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentRSVPs(rsvps || []);
    }
    fetchData();
  }, [currentEvent]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await eventService.createEvent(eventName);
    if (data) {
      await refreshEvents();
      setCurrentEvent(null); // Garante que continua na tela geral e não entra automaticamente
      setIsCreating(false);
      setEventName('');
      triggerToast('Casamento criado com sucesso!');
    }
  };

  // Funções portadas de EventosManager
  const handleEditClick = (e: React.MouseEvent, event: any) => {
    e.stopPropagation(); // Impede de abrir o dashboard do evento
    setEditingEvent(event);
    setEditFormData({ nome: event.nome, slug: event.slug });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const ok = await eventService.updateEvent(editingEvent.id, editFormData);
    if (ok) {
      setEditingEvent(null);
      await refreshEvents();
      setCurrentEvent(null);
      triggerToast('Casamento atualizado com sucesso!');
    } else {
      triggerToast('Erro ao atualizar evento.');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, event: any) => {
    e.stopPropagation(); 
    // Regra de Proteção: Evento Ativo só pode ser excluído por Master
    if (event.is_active && !isMaster) {
      triggerToast('Somente o Master pode excluir um casamento ativo.');
      return;
    }
    setDeletingEventId(event.id); // Abre o modal customizado
  };

  const handleRestoreEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const ok = await eventService.restoreEvent(eventId);
    if (ok) {
      await refreshEvents();
      setCurrentEvent(null); // Garante que não vai entrar no evento recém-restaurado
      await fetchDeleted();
      triggerToast('Casamento restaurado com sucesso!');
    } else {
      triggerToast('Erro ao restaurar casamento.');
    }
  };

  const executeConfirmDelete = async () => {
    if (!deletingEventId) return;

    const ok = await eventService.deleteEvent(deletingEventId);
    setDeletingEventId(null); // Fecha o modal

    if (ok) {
      await refreshEvents();
      setCurrentEvent(null); // Força manter na listagem geral e ignora auto-seleção do Contexto
      triggerToast('Casamento excluído com sucesso!');
    } else {
      triggerToast('Erro ao excluir evento.');
    }
  };

  const calculateDaysLeft = (date: string) => {
    if (!date) return 0;
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleActivate = async () => {
    if (!currentEvent) return;
    setActivating(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId: currentEvent.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar pagamento: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor de pagamentos.');
    } finally {
      setActivating(false);
    }
  };

  if (contextLoading) return <div className={styles.loading}>Carregando...</div>;

  // Se não houver evento selecionado, mostra a lista de casamentos (Modo Plataforma Centralizado)
  if (!currentEvent) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className="cursive">Meus Casamentos</h1>
            <p style={{ color: '#666', marginTop: '5px', fontSize: '0.9rem' }}>Gerencie seus eventos e acompanhe o progresso.</p>
          </div>
          <button onClick={() => setIsCreating(true)} className={styles.addBtn}>+ Novo Casamento</button>
        </header>
        
        <div className={styles.grid}>
          <AnimatePresence mode="popLayout">
            {events.map(event => {
              const userRoleForEvent = userRolesMap[event.id];
              // Somente Master e Owners podem editar/excluir
              const canManage = isMaster || userRoleForEvent === 'owner';

              return (
                <motion.div 
                  key={event.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={styles.card} 
                  onClick={() => setCurrentEvent(event)}
                >
                  <div className={styles.cardHeader}>
                    <h3>{event.nome}</h3>
                    <span className={event.is_active ? styles.activeBadgeMini : styles.pendingBadgeMini}>
                      {event.is_active ? 'Ativo' : 'Pendente'}
                    </span>
                  </div>
                  <span className={styles.slug}>inv/{event.slug}</span>
                  
                  <div className={styles.cardFooter}>
                    {/* Se for Staff, exibe tag de identificação */}
                    {!canManage && userRoleForEvent === 'organizador' && (
                      <span className={styles.roleTag}>Equipe</span>
                    )}
                    
                    {/* Ações aparecem apenas para Owner/Master */}
                    {canManage && (
                      <div className={styles.cardActions}>
                        <button 
                          className={styles.miniEditBtn} 
                          onClick={(e) => handleEditClick(e, event)}
                          title="Editar nome ou URL"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Editar
                        </button>
                        <button 
                          className={styles.miniDeleteBtn} 
                          onClick={(e) => handleDeleteClick(e, event)}
                          title="Excluir Casamento"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Seção de Lixeira/Restaurar (Restrita ao Master) */}
        {isMaster && (deletedEvents.length > 0 || showTrash) && (
          <div className={styles.trashContainer}>
            <div className={styles.trashHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Casamentos Excluídos (Retenção por 30 dias)</h3>
              <button 
                className={styles.toggleTrashBtn}
                onClick={() => setShowTrash(!showTrash)}
              >
                {showTrash ? 'Ocultar' : `Exibir (${deletedEvents.length})`}
              </button>
            </div>

            <AnimatePresence>
              {showTrash && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.grid}
                  style={{ overflow: 'hidden', opacity: 0.7 }}
                >
                  {deletedEvents.length === 0 && <p style={{color: '#666'}}>Nenhum casamento na lixeira.</p>}
                  {deletedEvents.map(event => (
                    <div key={event.id} className={styles.card} style={{ cursor: 'default', background: '#f9fafb' }}>
                      <div className={styles.cardHeader}>
                        <h3 style={{ color: '#9ca3af' }}>{event.nome}</h3>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                        Excluído em: {event.deleted_at ? new Date(event.deleted_at).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className={styles.cardFooter} style={{ marginTop: '1rem' }}>
                        <button 
                          className={styles.restoreBtn} 
                          onClick={(e) => handleRestoreEvent(e, event.id)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px'}}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Restaurar
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* MODAIS DE GESTÃO */}

        {isCreating && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className="cursive">Novo Casamento</h2>
              <form onSubmit={handleCreate} className={styles.modalForm}>
                <label>Nomes dos Noivos</label>
                <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Ex: Ana e Carlos" required />
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveBtn}>Criar</button>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsCreating(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingEvent && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className="cursive">Editar Casamento</h2>
              <form onSubmit={handleSaveEdit} className={styles.modalForm}>
                <label>Nome de Exibição</label>
                <input 
                  value={editFormData.nome} 
                  onChange={e => setEditFormData({ ...editFormData, nome: e.target.value })} 
                  required 
                />
                <label>URL do Convite (Slug)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>inv/</span>
                  <input 
                    style={{ flex: 1 }}
                    value={editFormData.slug} 
                    onChange={e => setEditFormData({ ...editFormData, slug: e.target.value })} 
                    required 
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveBtn}>Salvar</button>
                  <button type="button" className={styles.cancelBtn} onClick={() => setEditingEvent(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deletingEventId && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className="cursive" style={{ color: 'var(--admin-danger)' }}>Atenção</h2>
              <p style={{ margin: '1rem 0', color: '#4a5568', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Isso excluirá permanentemente o casamento, convites, presentes e fotos. Esta ação <strong>não pode ser desfeita</strong>. 
                Deseja continuar?
              </p>
              <div className={styles.modalActions}>
                <button onClick={executeConfirmDelete} className={styles.saveBtn}>Sim, Excluir</button>
                <button onClick={() => setDeletingEventId(null)} className={styles.cancelBtn}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showToast && (
            <motion.div 
              className={styles.toast}
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.toastIcon}>✓</div>
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }

  // Se houver evento, mostra o Dashboard Operacional (STORY-048)
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className="cursive">Painel do Casamento</h1>
        <div className={styles.status}>
          <span className={currentEvent.is_active ? styles.activeBadge : styles.pendingBadge}>
            {currentEvent.is_active ? 'Site Ativo' : 'Aguardando Ativação'}
          </span>
        </div>
      </header>

      {!currentEvent.is_active && (
        <div className={styles.activationBanner}>
          <div className={styles.activationText}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 2.6-2 2.6s1.34-.5 2.6-2"></path><path d="M8 13l5 5"></path><path d="M18.5 5.5c-2.5-2.5-6.5-2.5-9 0l-6.5 6.5c-1 1-1 2.5 0 3.5l2 2c1 1 2.5 1 3.5 0l6.5-6.5c2.5-2.5 2.5-6.5 0-9z"></path><path d="M15.5 8.5c2.5 2.5 6.5 2.5 9 0l.5-.5c1-1 1-2.5 0-3.5l-2-2c-1-1-2.5-1-3.5 0l-.5.5z"></path></svg>
              Seu site está quase pronto para os convidados!
            </h3>
            <p>Ative agora para liberar o RSVP online, lista de presentes e o acesso público ao seu convite digital.</p>
          </div>
          <button 
            onClick={handleActivate} 
            disabled={activating}
            className={styles.activateBtn}
          >
            {activating ? 'Processando...' : 'Ativar Site Agora'}
          </button>
        </div>
      )}

      {!currentEvent.onboarding_completed && (
        <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--admin-warning)', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
              Bem-vindo ao painel do seu evento!
            </h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--admin-text-primary)'}}>
              Seu convite inicial já está de pé! Vá na aba <strong>Configurações</strong> para adicionar as suas fotos de capa e biografia.
            </p>
          </div>
          <button 
            onClick={() => router.push('/admin/configuracoes')} 
            style={{ padding: '8px 16px', background: 'var(--admin-warning)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Personalizar
          </button>
        </div>
      )}

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Pessoas Confirmadas</span>
          <strong>{stats.totalConfirmados} / {stats.totalPessoasPossiveis}</strong>
          <div className={styles.progressBar}>
            <div style={{ width: `${Math.min(100, (stats.totalConfirmados / (stats.totalPessoasPossiveis || 1)) * 100)}%` }}></div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span>Presentes Recebidos</span>
          <strong>R$ {stats.valorPresentes.toLocaleString('pt-BR')}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Dias Restantes</span>
          <strong>{calculateDaysLeft('2026-06-13')}</strong>
        </div>
      </section>

      <div className={styles.dashboardContent}>
        <section className={styles.recentActivity}>
          <h3>Últimas Confirmações</h3>
          {recentRSVPs.length === 0 ? <p>Nenhuma atividade recente.</p> : (
            <ul className={styles.activityList}>
              {recentRSVPs.map(r => (
                <li key={r.id}>
                  <strong>{r.convites?.nome_principal}</strong> confirmou {r.confirmados} pessoa(s).
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showWizard && (
        <OnboardingWizard 
          eventId={currentEvent.id} 
          onComplete={async () => {
            setShowWizard(false);
            await refreshEvents();
          }} 
        />
      )}
    </main>
  );
}
