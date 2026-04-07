'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const [coupleNames, setCoupleNames] = useState({ noiva: 'L', noivo: 'M' });

  useEffect(() => {
    async function fetchNames() {
      const { data } = await supabase
        .from('configuracoes')
        .select('noiva_nome, noivo_nome')
        .eq('id', 1)
        .maybeSingle();
      
      if (data) {
        setCoupleNames({
          noiva: data.noiva_nome.charAt(0).toUpperCase(),
          noivo: data.noivo_nome.charAt(0).toUpperCase()
        });
      }
    }
    fetchNames();
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Convidados', path: '/admin/convidados', icon: '👥' },
    { name: 'Presentes', path: '/admin/presentes', icon: '🎁' },
    { name: 'Configurações', path: '/admin/configuracoes', icon: '⚙️' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2 className="cursive">{coupleNames.noiva} & {coupleNames.noivo}</h2>
        <p>Painel Admin</p>
      </div>
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
      </nav>
      <div className={styles.footer}>
        <Link href="/" className={styles.viewSite}>Ver Site Público</Link>
      </div>
    </aside>
  );
}
