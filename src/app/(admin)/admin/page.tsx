'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

import Link from 'next/link';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  // Check for existing cookie on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
      const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin-auth='));
      
      if (authCookie && authCookie.split('=')[1] === adminPassword) {
        setIsAuthorized(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    
    if (password === adminPassword) {
      // Set cookie for middleware (expires in 24h)
      const expires = new Date(Date.now() + 86400000).toUTCString();
      document.cookie = `admin-auth=${password}; path=/; expires=${expires}; samesite=strict`;
      
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthorized(false);
  };

  if (isAuthorized) {
    return (
      <main className={styles.adminContent}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h1>Dashboard Geral</h1>
            <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
          </div>
          <p>Bem-vindo, Organizador! Gerencie seu evento através do menu lateral.</p>
        </header>
        
        <div className={styles.dashboardGrid}>
          <Link href="/admin/convidados" className={styles.card}>
            <h3>Gestão de Convidados</h3>
            <p>Gerencie quem vai à festa.</p>
          </Link>
          <Link href="/admin/presentes" className={styles.card}>
            <h3>Lista de Presentes</h3>
            <p>Acompanhe os presentes.</p>
          </Link>
          <Link href="/admin/configuracoes" className={styles.card}>
            <h3>Configurações</h3>
            <p>Nomes, datas e locais.</p>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <h2 className="cursive">Acesso Restrito</h2>
        <p>Por favor, insira a senha do organizador:</p>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className={styles.input}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.loginBtn}>Entrar</button>
      </form>
    </main>
  );
}
