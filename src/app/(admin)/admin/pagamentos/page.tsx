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
          eventos(id, nome, is_active, deleted_at)
        `)
        .eq('user_id', session.user.id);
        
      if (!error && data) {
        // Filtragem rigorosa: EXCLUI casamentos deletados da listagem de pagamentos
        const filtered = data
          .map((d: any) => d.eventos)
          .filter((ev: any) => ev && !ev.deleted_at);
        setEventos(filtered);
      }
    }
    loadEventos();
  }, []);

  const handleCheckout = async (eventoId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ padding: '2.5rem', width: '100%', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '2.2rem', 
          fontWeight: 700, 
          color: 'var(--admin-header-text)',
          marginBottom: '0.2rem'
        }}>
          Gerenciamento de Assinaturas
        </h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
          Controle de licenças e ativação de recursos premium
        </p>
      </header>

      <div style={{ maxWidth: '900px' }}>
        {eventos.length === 0 ? (
          <div style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--admin-card-border)', borderRadius: '12px' }}>
            Nenhum evento ativo disponível para ativação financeira.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
          {eventos.map((ev) => (
            <div key={ev.id} style={{ 
              background: 'var(--admin-card-bg)', 
              padding: '1.5rem 2rem', 
              borderRadius: '16px', 
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              border: '1px solid var(--admin-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: 600 }}>
                  {ev.nome}
                </h3>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: ev.is_active ? 'var(--admin-success)' : 'var(--admin-warning)'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: ev.is_active ? 'var(--admin-success)' : 'var(--admin-warning)'
                  }}></div>
                  {ev.is_active ? 'Plano Ativo • Full Premium' : 'Modo Demonstração • Pendente'}
                </div>
              </div>
              <div>
                {!ev.is_active && (
                  <button 
                    onClick={() => handleCheckout(ev.id)}
                    disabled={loading}
                    style={{
                      background: 'var(--admin-accent)',
                      color: '#000', // Usar contraste no botão dourado
                      border: 'none',
                      padding: '0.85rem 1.5rem',
                      borderRadius: '8px',
                      cursor: loading ? 'wait' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(197, 160, 89, 0.2)'
                    }}
                  >
                    {loading ? 'Processando...' : 'Liberar Todos Recursos'}
                  </button>
                )}
                {ev.is_active && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>Licença Permanente</span>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
