'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { authService } from '@/lib/services/authService';
import { useEvent } from '@/lib/contexts/EventContext';
import { configService } from '@/lib/services/configService';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentEvent, events, setCurrentEvent } = useEvent();
  const [coupleNames, setCoupleNames] = useState({ noiva: '?', noivo: '?' });

  useEffect(() => {
    async function fetchNames() {
      if (!currentEvent) return;
      const data = await configService.getConfig(currentEvent.id);
      
      if (data) {
        setCoupleNames({
          noiva: data.noiva_nome?.charAt(0).toUpperCase() || '?',
          noivo: data.noivo_nome?.charAt(0).toUpperCase() || '?'
        });
      }
    }
    fetchNames();
  }, [currentEvent]);

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await authService.logout();
    }
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      )
    },
    { 
      name: 'Eventos', 
      path: '/admin/eventos', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      )
    },
    { 
      name: 'Convidados', 
      path: '/admin/convidados', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      )
    },
    { 
      name: 'Presentes', 
      path: '/admin/presentes', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
      )
    },
    { 
      name: 'Configurações', 
      path: '/admin/configuracoes', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      )
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2 className="cursive">{coupleNames.noiva} & {coupleNames.noivo}</h2>
        <p>Painel Admin</p>
      </div>

      {events.length > 1 && (
        <div className={styles.eventSelector}>
          <label htmlFor="event-select">Evento Atual:</label>
          <select 
            id="event-select"
            value={currentEvent?.id || ''} 
            onChange={(e) => {
              const found = events.find(ev => ev.id === e.target.value);
              if (found) setCurrentEvent(found);
            }}
            className={styles.select}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nome}</option>
            ))}
          </select>
        </div>
      )}

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.name}>{item.name}</span>
          </Link>
        ))}
        
        <button onClick={handleLogout} className={styles.navItem} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
          <span className={styles.icon}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </span>
          <span className={styles.name}>Sair</span>
        </button>
      </nav>
      <div className={styles.footer}>
        {currentEvent && (
          <Link href={`/inv/${currentEvent.slug}`} className={styles.viewSite} target="_blank">
            Ver Site do Evento
          </Link>
        )}
        <Link href="/" className={styles.viewSite}>Voltar para Home</Link>
      </div>
    </aside>
  );
}
