'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/admin/Sidebar";
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';
import { supabase } from '@/lib/supabase';

import { EventProvider } from '@/lib/contexts/EventContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Apenas para garantir que o cliente Supabase está ok no lado do cliente
    async function checkSession() {
      await supabase.auth.getSession();
      setSessionChecked(true);
    }
    checkSession();
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === '/admin/login';

  if (!sessionChecked && !isLoginPage) {
    return <div className={styles.loading}>Verificando sessão...</div>;
  }

  return (
    <EventProvider>
      <div className={styles.adminLayout}>
        {!isLoginPage && (
          <>
            <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
              <Sidebar />
            </div>
            <div 
              className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ''}`} 
              onClick={() => setIsSidebarOpen(false)}
            ></div>
            
            <header className={styles.mobileHeader}>
              <button 
                className={styles.hamburger} 
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Abrir menu"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <span className={styles.mobileTitle}>InviteEventAI Admin</span>
            </header>
          </>
        )}
        
        <div className={`${styles.mainContent} ${!isLoginPage ? styles.withSidebar : ''}`}>
          {children}
        </div>
      </div>
    </EventProvider>
  );
}

