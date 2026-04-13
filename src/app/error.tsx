'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('InviteEventAI Global Fallback Triggered:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', height: '100vh', 
      backgroundColor: '#fdfbf7', color: '#4a4a4a', fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#8fa89b' }}>Oops! Algo saiu dos conformes.</h2>
      <p style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: '500px' }}>
        Infelizmente ocorreu um contratempo ao carregar o convite. Mas não se preocupe, o RSVP está a salvo!
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 20px', borderRadius: '8px', 
            border: 'none', backgroundColor: '#8fa89b', color: '#fff', 
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Tentar novamente
        </button>
        <Link href="/" style={{
          padding: '10px 20px', borderRadius: '8px', 
          border: '1px solid #8fa89b', color: '#8fa89b', 
          textDecoration: 'none', fontWeight: 'bold'
        }}>
          Início
        </Link>
      </div>
    </div>
  );
}
