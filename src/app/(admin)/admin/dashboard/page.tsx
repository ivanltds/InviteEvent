'use client';

import { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { inviteService } from '@/lib/services/inviteService';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalConvites: 0,
    convitesRespondidos: 0,
    pessoasConfirmadas: 0,
    pessoasRecusadas: 0,
    pessoasPendentes: 0,
    excedentes: 0
  });
  const [financeiro, setFinanceiro] = useState({
    totalPresentes: 0,
    recebido: 0
  });
  const [restricoes, setRestricoes] = useState<{nome: string, texto: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const invites = await inviteService.getAllInvites();
      const calculated = inviteService.calculateDashboardStats(invites);
      setStats(calculated);

      // Restrições alimentares
      const comRestricao = invites
        .filter(i => i.rsvp && i.rsvp[0]?.restricoes)
        .map(i => ({ 
          nome: i.nome_principal, 
          texto: i.rsvp[0].restricoes || ''
        }));
      setRestricoes(comRestricao);

      // Buscar dados financeiros (presentes recebidos)
      const { data: comprovantes } = await supabase.from('comprovantes').select('presente:presentes(preco)');
      if (comprovantes) {
        const total = comprovantes.reduce((acc: number, curr: any) => acc + (curr.presente?.preco || 0), 0);
        setFinanceiro(prev => ({ ...prev, recebido: total }));
      }

      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) return <div className={styles.container}><p>Carregando dashboard...</p></div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard Geral</h1>
          <p>Visão em tempo real do seu grande dia.</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Pessoas Confirmadas</h3>
          <p className={styles.statNumber}>{stats.pessoasConfirmadas}</p>
          <p className={styles.statSub}>presenças garantidas</p>
        </div>
        <div className={styles.statCard}>
          <h3>Pendentes</h3>
          <p className={styles.statNumber} style={{ color: '#ecc94b' }}>{stats.pessoasPendentes}</p>
          <p className={styles.statSub}>aguardando resposta</p>
        </div>
        <div className={styles.statCard}>
          <h3>Convites Respondidos</h3>
          <p className={styles.statNumber}>{stats.convitesRespondidos} / {stats.totalConvites}</p>
          <p className={styles.statSub}>{Math.round((stats.convitesRespondidos / stats.totalConvites) * 100) || 0}% de adesão</p>
        </div>
        <div className={styles.statCard}>
          <h3>Financeiro Presentes</h3>
          <p className={styles.statNumber} style={{ color: '#48bb78' }}>
            {financeiro.recebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className={styles.statSub}>recebidos via PIX</p>
        </div>
      </section>

      <div className={styles.dashboardLayout}>
        <div className={styles.mainPanel}>
          <h2 className={styles.sectionTitle}>Monitor de Restrições Alimentares</h2>
          {restricoes.length > 0 ? (
            <div className={styles.restrictionsList}>
              {restricoes.map((item, idx) => (
                <div key={idx} className={styles.restrictionCard}>
                  <strong>{item.nome}</strong>
                  <p>{item.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fcfcfc', borderRadius: '8px', border: '1px dashed #ddd' }}>
              <p style={{ opacity: 0.6 }}>Nenhuma restrição alimentar informada até o momento.</p>
            </div>
          )}
        </div>
        
        <div className={styles.sidePanel}>
          <h2 className={styles.sectionTitle}>Resumo Operacional</h2>
          <ul className={styles.recentActivity}>
             <li className={styles.activityItem}>
               <span>Total de Convites</span>
               <span className={styles.badge + ' ' + styles.badgeInfo}>{stats.totalConvites}</span>
             </li>
             <li className={styles.activityItem}>
               <span>Pessoas Recusadas</span>
               <span className={styles.badge}>{stats.pessoasRecusadas}</span>
             </li>
             <li className={styles.activityItem}>
               <span>Excedentes Solicitados</span>
               <span className={styles.badge} style={{ backgroundColor: stats.excedentes > 0 ? '#fff5f5' : 'transparent', color: stats.excedentes > 0 ? '#c53030' : 'inherit' }}>
                 {stats.excedentes}
               </span>
             </li>
             <li className={styles.activityItem}>
               <span>Meta Financeira</span>
               <span className={styles.badgeSuccess}>Ativa</span>
             </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
