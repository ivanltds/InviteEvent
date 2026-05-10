'use client';

import { useState, useEffect } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';
import styles from './Dashboard.module.css';
import { useRouter } from 'next/navigation';
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
      setIsCreating(false);
      setEventName('');
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
    } else {
      alert('Erro ao atualizar evento.');
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation(); // Impede de abrir o dashboard do evento
    if (!confirm('ATENÇÃO: Isso excluirá permanentemente o casamento, convites, presentes e fotos. Esta ação não pode ser desfeita. Deseja continuar?')) return;

    const ok = await eventService.deleteEvent(eventId);
    if (ok) {
      await refreshEvents();
    } else {
      alert('Erro ao excluir evento.');
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
          {events.map(event => {
            const userRoleForEvent = userRolesMap[event.id];
            // Somente Master e Owners podem editar/excluir
            const canManage = isMaster || userRoleForEvent === 'owner';

            return (
              <div key={event.id} className={styles.card} onClick={() => setCurrentEvent(event)}>
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
                        ⚙️ Editar
                      </button>
                      <button 
                        className={styles.miniDeleteBtn} 
                        onClick={(e) => handleDeleteClick(e, event.id)}
                        title="Excluir Casamento"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
            <h3>🚀 Seu site está quase pronto para os convidados!</h3>
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
            <h4 style={{ margin: 0, fontSize: '1rem' }}>🎉 Bem-vindo ao painel do seu evento!</h4>
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
