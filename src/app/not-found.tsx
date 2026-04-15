'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', height: '100vh', 
      backgroundColor: '#fdfbf7', color: '#4a4a4a', fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#8fa89b' }}>404 - Página não encontrada</h2>
      <p style={{ marginBottom: '2rem' }}>O convite que você procura não está aqui.</p>
      <Link href="/" style={{
        padding: '10px 20px', borderRadius: '8px', 
        border: 'none', backgroundColor: '#8fa89b', color: '#fff', 
        cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none'
      }}>
        Voltar para o Início
      </Link>
    </div>
  );
}
