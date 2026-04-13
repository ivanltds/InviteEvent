'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { authService } from '@/lib/services/authService';
import { useEvent } from '@/lib/contexts/EventContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEvent, events, setCurrentEvent, userProfile, userRole, loading } = useEvent();

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await authService.logout();
    }
  };

  const isMaster = userProfile?.is_master;
  const isOwner = userRole === 'owner';

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
      name: 'Gestão de Eventos', 
      path: '/admin/eventos', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
      show: isMaster
    },
    { 
      name: 'Pagamentos', 
      path: '/admin/pagamentos', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
      show: isOwner || isMaster
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
      name: 'Galeria', 
      path: '/admin/galeria', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
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
      path: '/admin/equipe', 
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>,
      show: isOwner || isMaster
    },
  ];

  const renderNavItem = (item: any) => {
    if (!item.show) return null;

    const isActive = pathname === item.path;
    const className = `${styles.navItem} ${isActive ? styles.active : ''}`;

    if (item.onClick) {
      return (
        <button key={item.name} onClick={item.onClick} className={className} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.name}>{item.name}</span>
        </button>
      );
    }

    return (
      <Link key={item.path} href={item.path} className={className}>
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.name}>{item.name}</span>
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
                {!isMaster && isOwner && <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--admin-success)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OWNER</span>}
                {!isMaster && !isOwner && userRole === 'organizador' && <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>STAFF</span>}
              </div>
            </div>
          )}
          <button onClick={handleLogout} className={styles.navItem} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', opacity: 0.8 }}>
            <span className={styles.icon}><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline></svg></span>
            <span className={styles.name}>Sair da Conta</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
