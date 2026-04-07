'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/admin/Sidebar";
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    const checkAuth = () => {
      const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin-auth='));
      setIsAuthorized(!!(authCookie && authCookie.split('=')[1] === adminPassword));
    };

    checkAuth();
    // Re-check on every navigation within admin
    window.addEventListener('focus', checkAuth);
    return () => window.removeEventListener('focus', checkAuth);
  }, [pathname]);

  const showSidebar = isAuthorized && pathname !== '/admin';

  return (
    <div style={{ display: 'flex' }}>
      {showSidebar && <Sidebar />}
      <div style={{ 
        flex: 1, 
        marginLeft: showSidebar ? '260px' : '0', 
        width: showSidebar ? 'calc(100% - 260px)' : '100%',
        minHeight: '100vh',
        backgroundColor: '#f9f8f4'
      }}>
        {children}
      </div>
    </div>
  );
}
