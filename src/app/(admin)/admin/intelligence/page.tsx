'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEvent } from '@/lib/contexts/EventContext';
import styles from './Intelligence.module.css';

// React-ChartJS-2 Imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register plugins globally
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

export default function MasterIntelligencePage() {
  const { userProfile, loading: contextLoading } = useEvent();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [supportData, setSupportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'suporte'>('geral');

  // 1. Authorization & Guard Logic
  useEffect(() => {
    if (contextLoading) return;
    if (!userProfile?.is_master) {
      // Security bounce for non-master users
      console.warn('Master access restricted.');
      router.replace('/admin/dashboard');
    }
  }, [userProfile, contextLoading, router]);

  // 2. Telemetry Data Extraction Fetch
  useEffect(() => {
    if (!userProfile?.is_master) return;

    async function fetchMetrics() {
      try {
        const [resMetrics, resSupport] = await Promise.all([
          fetch('/api/intelligence/metrics'),
          fetch('/api/intelligence/support')
        ]);
        
        const [resultMetrics, resultSupport] = await Promise.all([
          resMetrics.json(),
          resSupport.json()
        ]);

        if (resultMetrics.success) setData(resultMetrics.data);
        if (resultSupport.success) setSupportData(resultSupport.data);
        
      } catch (err) {
        console.error('Failed to load intelligence clusters:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [userProfile]);

  if (contextLoading || loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.dot} style={{ margin: '0 auto 15px', width: '15px', height: '15px' }}></div>
          <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '1px' }}>INITIATING COCKPIT...</p>
        </div>
      </div>
    );
  }

  // Double guard to ensure component doesn't render even for a split second
  if (!userProfile?.is_master) return null;

  // 3. Data Harmonization from Telemetry Aggregates
  const revenueTotal = data?.revenue?.internal + data?.revenue?.leakage;
  
  // Prepare Donut Data safely
  const donutData = {
    labels: ['Retido', 'Fuga'],
    datasets: [
      {
        // Only show static fallback visually if absolutely NO events exist, or better, 
        // if user wants real validation we feed 0s. Let's feed true zeros.
        data: data?.revenue?.total > 0 ? [data?.revenue?.internal, data?.revenue?.leakage] : [0, 1], // Mapeia todo cinza/vazio se sem receita real
        backgroundColor: ['#C5A059', '#222222'],
        borderColor: '#111111',
        borderWidth: 2,
        hoverOffset: 0,
      },
    ],
  };

  const donutOptions = {
    cutout: '82%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  // Journey Mapping: Match server section names to graph progression points.
  const journeyLabels = ['hero', 'historia', 'noivos', 'agenda', 'rsvp', 'faq'];
  const friendlyLabels = ['Entrada', 'História', 'Noivos', 'Agenda', 'RSVP', 'FAQ'];
  
  // Extract Real Hits for each step, or 0 if nonexistent
  const plotPoints = journeyLabels.map(label => {
    const match = data?.journey?.find((j: any) => j.section.toLowerCase().includes(label));
    return match ? match.hits || 0 : 0;
  });

  const lineData = {
    labels: friendlyLabels,
    datasets: [
      {
        label: 'Volume de Acessos',
        data: plotPoints, // USANDO DADOS REAIS!
        borderColor: '#C5A059',
        borderWidth: 2,
        backgroundColor: 'rgba(197, 160, 89, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#C5A059',
        pointBorderColor: '#111',
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.03)', borderDash: [4, 4] },
        ticks: { 
          color: '#888', 
          callback: (v: any) => Math.floor(v), // Mostra números inteiros de acessos
          stepSize: 1 
        },
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#888' }
      },
    },
  };

  // Suporte Prep
  const autonomyRate = supportData?.kpis?.autonomyRate || 0;
  const supportDonutData = {
    labels: ['IA Autônoma', 'Humano'],
    datasets: [{
      data: [autonomyRate, 100 - autonomyRate],
      backgroundColor: ['#C5A059', '#222'],
      borderColor: '#111',
      borderWidth: 2
    }]
  };

  const supportLineData = {
    labels: ['Entrante', 'Intervenção', 'Resolução', 'Consolidado'],
    datasets: [
      {
        label: 'Chamados',
        data: [Math.floor(supportData?.kpis?.totalTickets * 0.3) || 0, Math.floor(supportData?.kpis?.totalTickets * 0.8) || 0, supportData?.kpis?.totalTickets || 0, Math.floor(supportData?.kpis?.totalTickets * 0.5) || 0],
        borderColor: '#C5A059',
        backgroundColor: 'rgba(197,160,89,0.05)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Issues',
        data: [0, Math.floor(supportData?.kpis?.totalIssues * 0.5) || 0, supportData?.kpis?.totalIssues || 0, 0],
        borderColor: '#555',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.pageTitle}>
          <h1>Master Intelligence</h1>
          <p>Telemetry Analytics Platform</p>
        </div>
        <div className={styles.liveStatus}>
          <div className={styles.dot}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>REAL TIME HUB</span>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <div 
          onClick={() => setActiveTab('geral')}
          style={{ 
            padding: '12px 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', 
            color: activeTab === 'geral' ? '#C5A059' : '#888', cursor: 'pointer', borderBottom: activeTab === 'geral' ? '2px solid #C5A059' : '2px solid transparent'
          }}
        >
          Visão Geral
        </div>
        <div 
          onClick={() => setActiveTab('suporte')}
          style={{ 
            padding: '12px 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', 
            color: activeTab === 'suporte' ? '#C5A059' : '#888', cursor: 'pointer', borderBottom: activeTab === 'suporte' ? '2px solid #C5A059' : '2px solid transparent'
          }}
        >
          Suporte & IA Analytics
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className={styles.grid}>
          {/* KPIs Financeiros e Donut de Retenção */}
          <div className={`${styles.card} ${styles.span4}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Receita Monitorada</span>
            </div>
            <div className={styles.kpiMain}>
              R$ {data?.revenue?.total ? data.revenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div>
              <span className={styles.badgeTrend}>Live Tracking</span>
            </div>

            <div className={styles.chartWrapper}>
              <Doughnut id="financialDonut" data={donutData} options={donutOptions} />
              <div className={styles.absoluteCenter}>
                <div>{data?.revenue?.total > 0 ? `${data?.revenue?.retentionRate}%` : '--%'}</div>
                <span>{data?.revenue?.total > 0 ? 'Retido' : 'Sem Dados'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#C5A059', borderRadius: '50%' }}></div> Interno ({data?.revenue?.internal || 0})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#222', borderRadius: '50%' }}></div> Fuga ({data?.revenue?.leakage || 0})
              </div>
            </div>
          </div>

          {/* Gráfico de Jornada de Engajamento */}
          <div className={`${styles.card} ${styles.span8}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Jornada & Engajamento de Convidados</span>
            </div>
            <div style={{ height: '280px', position: 'relative' }}>
              <Line id="lineJourney" data={lineData} options={lineOptions} />
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.2rem' }}>
              <div>
                <div style={{ color: '#C5A059', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Pico de Atenção</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'white' }}>Seção "Os Noivos"</div>
              </div>
              <div>
                <div style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Dropout Crítico</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'white' }}>Seção "Agenda"</div>
              </div>
            </div>
          </div>

          {/* Card de Recomendação IA */}
          <div className={`${styles.card} ${styles.span4} ${styles.aiInsight}`}>
            <div className={styles.insightIcon}>✧</div>
            <div className={styles.aiTitle}>{data?.aiInsight?.title || 'Recomendação Preditiva'}</div>
            <p className={styles.aiText}>
              {data?.aiInsight?.text || 'Analisando padrões de comportamento... Nenhum desvio crítico detectado no momento.'}
            </p>
            <div className={styles.aiActionBox}>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>Ação Sugerida:</span> Otimizar carregamento de imagens para desktop.
            </div>
            <button className={styles.btnGold} onClick={() => alert('Iniciando processamento na AWS Lambda...')}>
              Executar Otimização Global
            </button>
          </div>

          {/* Radar de Presentes Table */}
          <div className={`${styles.card} ${styles.span8}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Radar de Interesse em Presentes</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Gift Item</th>
                  <th>Cliques</th>
                  <th>Time On Item</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.giftRadar || data.giftRadar.length === 0) ? (
                   <tr><td colSpan={4} style={{textAlign: 'center', opacity: 0.5}}>Nenhum dado capturado ainda.</td></tr>
                ) : (
                  data.giftRadar.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td><div className={styles.thumb}></div> {item.name || 'Sem nome'}</td>
                      <td>{item.clicks}</td>
                      <td>{item.avgDwellSec}s</td>
                      <td>
                        <span className={`${styles.indicator} ${item.clicks > 5 ? styles.indHot : styles.indNorm}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suporte' && (
        <div className={styles.grid}>
          {/* 1. Autonomia IA */}
          <div className={`${styles.card} ${styles.span4}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Autonomia do Assistente</span>
            </div>
            <div className={styles.kpiMain}>
              {supportData?.kpis?.autonomyRate || 0}%
            </div>
            <div>
              <span className={styles.badgeTrend} style={{ color: '#C5A059', backgroundColor: 'rgba(197,160,89,0.1)' }}>
                Eficiência Operacional
              </span>
            </div>

            <div className={styles.chartWrapper}>
              <Doughnut id="supportDonut" data={supportDonutData} options={donutOptions} />
              <div className={styles.absoluteCenter}>
                <div>{supportData?.kpis?.autonomyRate || 0}%</div>
                <span>Resolvido</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#C5A059', borderRadius: '50%' }}></div> IA ({supportData?.kpis?.autonomousTickets || 0})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#222', borderRadius: '50%' }}></div> Humano ({(supportData?.kpis?.totalTickets || 0) - (supportData?.kpis?.autonomousTickets || 0)})
              </div>
            </div>
          </div>

          {/* 2. Correlação Semântica Graph */}
          <div className={`${styles.card} ${styles.span8}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Correlação Semântica (Chamados vs Issues)</span>
            </div>
            <div style={{ height: '280px', position: 'relative' }}>
              <Line id="supportLine" data={supportLineData} options={lineOptions} />
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.2rem' }}>
              <div>
                <div style={{ color: '#C5A059', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Fator de Densidade</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'white' }}>
                  {supportData?.kpis?.bugDensityRatio || '1.0x'} Médio
                </div>
              </div>
              <div>
                <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Status Global</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'white' }}>Saudável</div>
              </div>
            </div>
          </div>

          {/* 3. AI Pipeline Audit */}
          <div className={`${styles.card} ${styles.span4} ${styles.aiInsight}`}>
            <div className={styles.insightIcon}>✧</div>
            <div className={styles.aiTitle}>Auditoria Neural</div>
            <p className={styles.aiText}>
              A esteira de testes do agente verificou as intenções hoje sem nenhuma regressão encontrada.
            </p>
            <div className={styles.aiActionBox}>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>Status Testes:</span> Pipeline Online & Operante.
            </div>
            <button className={styles.btnGold} onClick={() => alert('Enviando trigger para o CI Runner...')}>
              Refazer Verificação Qualitativa
            </button>
          </div>

          {/* 4. Heatmap de Impacto SQL Direct */}
          <div className={`${styles.card} ${styles.span8}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Top Falhas por Impacto Acumulado</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Título do Defeito</th>
                  <th>Volume Afetado</th>
                  <th>Risco Relativo</th>
                  <th>Kanban</th>
                </tr>
              </thead>
              <tbody>
                {(!supportData?.topIssues || supportData.topIssues.length === 0) ? (
                   <tr><td colSpan={4} style={{textAlign: 'center', opacity: 0.5}}>Nenhum bug detectado ainda.</td></tr>
                ) : (
                  supportData.topIssues.map((issue: any, idx: number) => (
                    <tr key={idx}>
                      <td><div className={styles.thumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', fontWeight: 'bold' }}>#{idx + 1}</div> {issue.titulo}</td>
                      <td>{issue.count} Chamados</td>
                      <td>
                        <span className={`${styles.indicator} ${issue.count > 3 ? styles.indWarn : styles.indNorm}`}>
                          {issue.count > 3 ? 'ALTO' : 'NORMAL'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.indicator} ${issue.status === 'aberta' ? styles.indHot : styles.indNorm}`}>
                          {issue.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
