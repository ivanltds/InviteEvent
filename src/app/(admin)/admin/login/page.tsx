'use client';

import { useState } from 'react';
import styles from '../admin.module.css';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        alert('Conta criada! Agora você pode fazer login.');
        setIsSignUp(false);
      } else {
        const success = await authService.login(email, password);
        if (success) {
          router.push('/admin/dashboard');
          router.refresh();
        } else {
          setError('E-mail ou senha incorretos.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className="cursive">{isSignUp ? 'Criar Conta' : 'Acesso Organizador'}</h2>
        <p>
          {isSignUp 
            ? 'Crie sua conta para gerenciar seu evento.' 
            : 'Entre com seu e-mail e senha cadastrados.'}
        </p>
        
        <input 
          type="email" 
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="E-mail"
          className={styles.input}
          required
          disabled={loading}
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="Senha"
          className={styles.input}
          required
          disabled={loading}
        />

        {error && <p className={styles.error}>{error}</p>}
        
        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
        </button>

        <button 
          type="button" 
          className={styles.toggleMode} 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ 
            background: 'none', 
            border: 'none', 
            marginTop: '1rem', 
            cursor: 'pointer',
            color: 'var(--accent-safe)',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar Agora'}
        </button>
      </form>
    </main>
  );
}
