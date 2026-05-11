'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { authService } from '@/lib/services/authService';
import { useEvent } from '@/lib/contexts/EventContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEvent, events, setCurrentEvent, userProfile, userRole, loading } = useEvent();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    await authService.logout();
    // O authService.logout já cuida do redirecionamento
  };

  const isMaster = userProfile?.is_master;
  const isOwner = userRole === 'owner';

  // Phase 4: Realtime Surveillance for Support Badges
  const [pendingAttention, setPendingAttention] = useState(0);

  useEffect(() => {
    if (!isMaster) return;
    
    // Direct connection to initial state
    import('@/lib/supabase').then(async ({ supabase }) => {
      const loadCount = async () => {
         const { count } = await supabase
           .from('suporte_tickets')
           .select('*', { count: 'exact', head: true })
           .eq('needs_human_attention', true);
         setPendingAttention(count || 0);
      };
      
      loadCount();

      const channel = supabase
        .channel('support-attention-notifs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'suporte_tickets' }, () => {
           loadCount();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, [isMaster]);

  // Itens da Camada Gerencial (Plataforma)
  const platformItems = [
    { 
      name: 'Meus Casamentos', 
      path: '/admin/dashboard', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
      show: true,
      onClick: () => {
        setCurrentEvent(null);
        router.push('/admin/dashboard');
      }
    },
    { 
      name: 'Pagamentos', 
      path: '/admin/pagamentos', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
      show: isOwner || isMaster
    },
    { 
      name: 'Suporte', 
      path: '/admin/suporte', 
      badge: pendingAttention > 0 ? pendingAttention : undefined,
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
      show: isMaster
    },
    { 
      name: 'Intelligence', 
      path: '/admin/intelligence', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V8"></path><path d="M22 4L12 14l-4-4-6 6"></path></svg>,
      show: isMaster
    },
  ];

  // Itens da Camada Operacional (Evento)
  const eventItems = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard',
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>,
      show: true
    },
    { 
      name: 'Convidados', 
      path: '/admin/convidados', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>,
      show: true
    },
    { 
      name: 'Presentes', 
      path: '/admin/presentes', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect></svg>,
      show: true
    },
    { 
      name: 'Agenda', 
      path: '/admin/agenda', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
      show: true
    },
    { 
      name: 'Mural', 
      path: '/admin/mural', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
      show: isOwner || isMaster
    },
    { 
      name: 'Configurações', 
      path: '/admin/configuracoes', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
      show: isOwner || isMaster
    },
    { 
      name: 'Equipe', 
      path: '/admin/configuracoes#equipe', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>,
      show: isOwner || isMaster
    },
    {
      name: 'Visualizar Convite',
      path: '/admin/visualizar',
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
      show: true
    }
  ];

  const renderNavItem = (item: any) => {
    if (!item.show) return null;

    const isActive = pathname === item.path;
    const className = `${styles.navItem} ${isActive ? styles.active : ''}`;

    if (item.onClick) {
      return (
        <button key={item.name} onClick={item.onClick} className={className} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.name}>{item.name}</span>
          {item.badge && <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '999px' }}>{item.badge}</span>}
        </button>
      );
    }

    return (
      <Link key={item.path} href={item.path} className={className} style={{ position: 'relative' }}>
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.name}>{item.name}</span>
        {item.badge && <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '999px' }}>{item.badge}</span>}
      </Link>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2 className="cursive">InviteEventAI</h2>
      </div>

      <div className={styles.contextSwitcher}>
        {currentEvent ? (
          <div 
            className={`${styles.activeEvent} ${styles.highlight}`} 
            onClick={() => {
              setCurrentEvent(null);
              router.push('/admin/dashboard');
            }}
          >
            <div className={styles.eventInfo}>
              <span style={{fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6}}>
                Editando Evento
              </span>
              <strong style={{ display: 'block', fontSize: '1.05rem', margin: '2px 0' }}>{currentEvent.nome}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-accent)' }}>
                ↩ Trocar Casamento
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.noEvent}>Área de Plataforma</div>
        )}
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <p className={styles.sectionTitle}>{currentEvent ? 'Módulos do Casamento' : 'Minha Conta'}</p>
          {(currentEvent ? eventItems : platformItems).map(renderNavItem)}
        </div>
        
        <div className={styles.bottomNav}>
          {userProfile && (
            <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid var(--admin-sidebar-border)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-sidebar-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile.email}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                {isMaster && <span style={{ fontSize: '0.65rem', background: 'var(--admin-sidebar-active-bg)', color: 'var(--admin-sidebar-active-text)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MASTER</span>}
                {!isMaster && isOwner && <span style={{ fontSize: '0.65rem', background: 'rgba(197, 160, 89, 0.15)', color: 'var(--admin-accent)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PROPRIETÁRIO</span>}
                {!isMaster && !isOwner && userRole === 'organizador' && <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ORGANIZADOR</span>}
              </div>
            </div>
          )}
          <button onClick={handleLogoutClick} className={styles.navItem} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', opacity: 0.8 }}>
            <span className={styles.icon}><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline></svg></span>
            <span className={styles.name}>Sair da Conta</span>
          </button>
        </div>
      </nav>

      {/* Modal Premium de Confirmação de Sair */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className={styles.modal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={styles.modalContent}
            >
              <div style={{ color: 'var(--admin-accent)', marginBottom: '1.5rem' }}>
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" style={{ opacity: 0.8 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <h3>Encerrar Sessão</h3>
              <p>Tem certeza que deseja sair da sua conta agora?</p>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={executeLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
}
