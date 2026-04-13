'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PagamentosPage() {
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    async function loadEventos() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('evento_organizadores')
        .select(`
          evento_id,
          eventos(id, nome, is_active)
        `)
        .eq('user_id', session.user.id);
        
      if (!error && data) {
        setEventos(data.map((d: any) => d.eventos));
      }
    }
    loadEventos();
  }, []);

  const handleCheckout = async (eventoId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventoId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao gerar checkout');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="cursive" style={{ color: 'var(--admin-accent)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Planos e Pagamentos</h1>
      <p style={{ color: 'var(--admin-text-primary)', marginBottom: '2rem' }}>
        Ative seu evento para liberar confirmação de presença real (RSVP ilimitado) e presentes convertidos em dinheiro!
      </p>

      {eventos.length === 0 ? (
        <p>Você ainda não possui eventos.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {eventos.map((ev) => (
            <div key={ev.id} style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid var(--admin-neutral)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--admin-text-main)' }}>{ev.nome}</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: ev.is_active ? 'var(--admin-success)' : 'var(--admin-warning)', fontWeight: 'bold' }}>
                    Status: {ev.is_active ? 'Plano Ativo (Ilimitado)' : 'Demonstração (Inativo)'}
                  </p>
                </div>
                {!ev.is_active && (
                  <button 
                    onClick={() => handleCheckout(ev.id)}
                    disabled={loading}
                    style={{
                      background: 'var(--admin-accent)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: loading ? 'wait' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Aguarde...' : 'Ativar por R$ 99,00'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
