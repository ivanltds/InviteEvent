'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/admin/Sidebar";
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    const checkAuth = () => {
      const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin-auth='));
      setIsAuthorized(!!(authCookie && authCookie.split('=')[1] === adminPassword));
    };

    checkAuth();
    window.addEventListener('focus', checkAuth);
    return () => window.removeEventListener('focus', checkAuth);
  }, [pathname]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const showSidebar = isAuthorized && pathname !== '/admin';

  if (!isAuthorized && pathname !== '/admin') {
    return null; // or a loading state, middleware handles redirect
  }

  return (
    <div className={styles.adminLayout}>
      {showSidebar && (
        <>
          <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
            <Sidebar />
          </div>
          {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
          
          <header className={styles.mobileHeader}>
            <button 
              className={styles.hamburger} 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <span className={styles.mobileTitle}>L & M Admin</span>
          </header>
        </>
      )}
      
      <div className={`${styles.mainContent} ${showSidebar ? styles.withSidebar : ''}`}>
        {children}
      </div>
    </div>
  );
}
