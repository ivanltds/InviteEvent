'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/admin/Sidebar";
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';
import { supabase } from '@/lib/supabase';

import { EventProvider, useEvent } from '@/lib/contexts/EventContext';
import FloatingChatWidget from '@/components/support/FloatingChatWidget';

// Componente Interno para poder acessar useEvent hook do Provider
function AdminInnerLayout({ 
  children, 
  shouldHideLayout, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: { 
  children: React.ReactNode; 
  shouldHideLayout: boolean; 
  isSidebarOpen: boolean; 
  setIsSidebarOpen: (val: boolean) => void; 
}) {
  const { currentEvent } = useEvent();
  const pathname = usePathname();
  
  // Força Nível Plataforma se a rota for explicitamente global
  const isGlobalPlatformRoute = 
    pathname.startsWith('/admin/suporte') || 
    pathname.startsWith('/admin/pagamentos') || 
    pathname.startsWith('/admin/catalogo') || 
    pathname.startsWith('/admin/intelligence');

  const isPlatformLevel = !currentEvent || isGlobalPlatformRoute;
  const themeClass = isPlatformLevel ? 'admin-theme-dark' : '';

  return (
    <div className={`${styles.adminLayout} ${themeClass}`}>
      {!shouldHideLayout && (
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
      
      <div className={`${styles.mainContent} ${!shouldHideLayout ? styles.withSidebar : ''}`}>
        {children}
      </div>
      {!shouldHideLayout && <FloatingChatWidget />}
    </div>
  );
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    async function checkSession() {
      await supabase.auth.getSession();
      setSessionChecked(true);
    }
    checkSession();
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const isLoginPage = pathname === '/admin/login';
  const isFullscreenPreview = pathname === '/admin/visualizar';
  const shouldHideLayout = isLoginPage || isFullscreenPreview;

  if (!sessionChecked && !isLoginPage) {
    return <div className={styles.loading}>Verificando sessão...</div>;
  }

  return (
    <EventProvider>
      <AdminInnerLayout 
        shouldHideLayout={shouldHideLayout} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
      >
        {children}
      </AdminInnerLayout>
    </EventProvider>
  );
}
