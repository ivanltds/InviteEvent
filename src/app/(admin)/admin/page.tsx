'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check for existing cookie on mount
  useEffect(() => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin-auth='));
    
    if (authCookie && authCookie.split('=')[1] === adminPassword) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    
    if (password === adminPassword) {
      // Set cookie for middleware (expires in 24h)
      const expires = new Date(Date.now() + 86400000).toUTCString();
      document.cookie = `admin-auth=${password}; path=/; expires=${expires}; samesite=strict`;
      
      router.push('/admin/dashboard');
      setError('');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <h2 className="cursive">Acesso Restrito</h2>
        <p>Por favor, insira a senha do organizador:</p>
        <input 
          type="password" 
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder="Senha"
          className={styles.input}
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.loginBtn}>Entrar</button>
      </form>
    </main>
  );
}
