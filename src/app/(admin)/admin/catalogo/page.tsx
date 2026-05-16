'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEvent } from '@/lib/contexts/EventContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CatalogoGlobal.module.css';

export default function CatalogoGlobalPage() {
  const { userProfile, loading: contextLoading } = useEvent();
  const router = useRouter();

  // API Data States
  const [presentes, setPresentes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]); // Candidatos locais a catálogo
  const [activeTab, setActiveTab] = useState<'catalogo' | 'candidatos'>('catalogo'); // Controle de Abas do Cockpit
  
  const [kpis, setKpis] = useState<any>({
    totalItems: 0,
    pausados: 0,
    linksQuebrados: 0,
    amazonCount: 0,
    magaluCount: 0,
    totalCandidatos: 0
  });

  // UI State Management
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // Default to Cards/Grid per request
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; text: string }[]>([]);

  // --- PAGINAÇÃO PROGRESSIVA ---
  const [visibleCatalogo, setVisibleCatalogo] = useState(10);
  const [visibleCandidatos, setVisibleCandidatos] = useState(10);

  // Modals State
  const [activeModal, setActiveModal] = useState<'view' | 'form' | 'delete' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form States (Controlled inputs for create/edit modal)
  const [formState, setFormState] = useState({
    id: '',
    nome: '',
    preco: '',
    preco_de: '',
    descricao: '',
    imagem_url: '',
    categoria_id: '',
    link_varejo_padrao: '',
    parceiro_nome: '',
    is_paused: false
  });

  // Double Security Guard for Master Access
  useEffect(() => {
    if (contextLoading) return;
    if (!userProfile?.is_master) {
      router.replace('/admin/dashboard');
    }
  }, [userProfile, contextLoading, router]);

  // Fetch Inventory on Mount
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/catalogo');
      const json = await res.json();
      if (json.success) {
        setPresentes(json.data.presentes);
        setCategorias(json.data.categorias);
        setCandidatos(json.data.candidatos || []);
        setKpis(json.data.kpis);
      } else {
        showToast('error', json.error || 'Falha ao carregar inventário.');
      }
    } catch (err) {
      showToast('error', 'Erro de rede ao conectar ao catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.is_master) {
      fetchInventory();
    }
  }, [userProfile]);

  // Toasts Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Dynamic Inline SVG Image Fallback helper
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23181818'/%3E%3Ctext x='50%25' y='50%25' font-family='monospace' font-size='10' fill='%23555' dominant-baseline='middle' text-anchor='middle'%3ESEM IMAGEM%3C/text%3E%3C/svg%3E";
  };

  // CURD Operations Trigger Handlers
  const handleOpenForm = (item: any | null = null) => {
    if (item) {
      setFormState({
        id: item.id,
        nome: item.nome || '',
        preco: item.preco?.toString() || '',
        preco_de: item.preco_de?.toString() || '',
        descricao: item.descricao || '',
        imagem_url: item.imagem_url || '',
        categoria_id: item.categoria_id || '',
        link_varejo_padrao: item.link_varejo_padrao || '',
        parceiro_nome: item.parceiro_nome || '',
        is_paused: item.is_paused || false
      });
    } else {
      setFormState({
        id: '',
        nome: '',
        preco: '',
        preco_de: '',
        descricao: '',
        imagem_url: '',
        categoria_id: categorias[0]?.id || '',
        link_varejo_padrao: '',
        parceiro_nome: '',
        is_paused: false
      });
    }
    setActiveModal('form');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!formState.id;
      const method = isEdit ? 'PATCH' : 'POST';
      
      const payload = { ...formState };
      if (!isEdit) delete (payload as any).id;

      const res = await fetch('/api/admin/catalogo', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      
      if (json.success) {
        showToast('success', isEdit ? 'Item atualizado com sucesso.' : 'Novo item cadastrado globalmente.');
        setActiveModal(null);
        fetchInventory();
      } else {
        showToast('error', json.error || 'Erro ao processar formulário.');
      }
    } catch (err) {
      showToast('error', 'Falha de conexão ao salvar.');
    }
  };

  const handleTogglePause = async (item: any) => {
    try {
      const newPausedState = !item.is_paused;
      const res = await fetch('/api/admin/catalogo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_paused: newPausedState })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', newPausedState ? `"${item.nome}" pausado para importações.` : `"${item.nome}" reativado no catálogo.`);
        fetchInventory();
      } else {
        showToast('error', 'Falha ao pausar item.');
      }
    } catch (err) {
      showToast('error', 'Erro na requisição de pausa.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/admin/catalogo?id=${selectedItem.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setActiveModal(null);
        setSelectedItem(null);
        fetchInventory();
        // Usamos o Modal/Toast robusto baseado na ramificação retornada pelo backend
        if (json.action === 'archived') {
          // Mostra uma notificação customizada por ter histórico financeiro
          showToast('success', 'Item arquivado (Soft-Delete) para proteger relatórios.');
          alert(`Operação Segura Realizada: ${json.message}`);
        } else {
          showToast('success', 'Item removido permanentemente com sucesso.');
        }
      } else {
        showToast('error', json.error || 'Falha na exclusão do item.');
      }
    } catch (err) {
      showToast('error', 'Erro de rede na exclusão.');
    }
  };

  // Enfileiramento em massa para links que estão na Fila de Cura ou quebrados
  const handleTriggerBulkCuration = async () => {
    // Identifica quais itens estão "quebrados" no dataset filtrado ou de exemplo
    // Em cenários reais, o administrador pode forçar curar toda a fila.
    // Filtra itens simulados ou sem ID válido para evitar erro de UUID no banco
    const quebrados = presentes.filter(p => 
      (p.id && p.id.length === 36) && // UUID check básico
      (!p.link_varejo_padrao || p.parceiro_nome === 'DESCONHECIDO')
    );
    
    const targetItems = quebrados.length > 0 ? quebrados : presentes.filter(p => p.id && p.id.length === 36).slice(0, 2); 
    
    if (targetItems.length === 0) {
      showToast('error', 'Nenhum link no catálogo para realizar enfileiramento.');
      return;
    }

    try {
      const payload = targetItems.map(t => ({
        id: t.id,
        link: t.link_varejo_padrao || 'NÃO REGISTRADO',
        nome: t.nome
      }));

      const res = await fetch('/api/admin/catalogo/bulk-curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload })
      });
      
      const json = await res.json();
      
      if (json.success) {
        showToast('success', `Fila acionada! ${json.count} itens movidos para triagem do Daemon.`);
        fetchInventory();
      } else {
        showToast('error', json.error || 'Erro ao registrar fila.');
      }
    } catch (err: any) {
      console.error('Erro ao registrar fila:', err);
      showToast('error', `Falha de conexão: ${err.message || 'Erro desconhecido'}`);
    }
  };

  // Enfileiramento individual de um único item para cura
  const handleSingleCurate = async (item: any) => {
    if (!item.id || item.id.length !== 36) {
      showToast('error', 'Este item é uma simulação e não pode ser enfileirado no banco real.');
      return;
    }
    try {
      const payload = [{
        id: item.id,
        link: item.link_varejo_padrao || 'NÃO REGISTRADO',
        nome: item.nome
      }];

      const res = await fetch('/api/admin/catalogo/bulk-curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload })
      });
      
      const json = await res.json();
      
      if (json.success) {
        showToast('success', `"${item.nome}" enviado para triagem na Fila de Cura!`);
        fetchInventory();
      } else {
        showToast('error', json.error || 'Erro ao enfileirar item.');
      }
    } catch (err: any) {
      console.error('Erro ao enfileirar:', err);
      showToast('error', `Falha de conexão: ${err.message || 'Erro desconhecido'}`);
    }
  };

  // Aprovar presente candidato local promovendo para catálogo mestre
  const handleApproveCandidate = async (presenteId: string) => {
    if (!confirm('Deseja realmente aprovar e promover este presente ao catálogo global?')) return;
    try {
      const res = await fetch('/api/admin/catalogo/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenteId })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message);
        fetchInventory();
      } else {
        showToast('error', json.error || 'Erro ao aprovar candidato.');
      }
    } catch (err) {
      showToast('error', 'Erro na requisição de aprovação.');
    }
  };

  // Filtering dynamic logic
  const filteredPresentes = presentes.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.nome?.toLowerCase().includes(searchLower) ||
      item.parceiro_nome?.toLowerCase().includes(searchLower) ||
      item.categoria_nome?.toLowerCase().includes(searchLower)
    );
  });

  const filteredCandidatos = candidatos.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.nome?.toLowerCase().includes(searchLower) ||
      item.descricao?.toLowerCase().includes(searchLower) ||
      item.evento?.nome?.toLowerCase().includes(searchLower) ||
      item.categoria?.nome?.toLowerCase().includes(searchLower)
    );
  });

  // Guard renders for splash-load
  if (contextLoading || !userProfile?.is_master) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090909', color: '#555' }}>
        <p>VERIFICANDO CREDENCIAIS MASTER...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerFlex}>
        <div className={styles.pageTitle}>
          <h1>Gestão Global de Presentes</h1>
          <p>Console Mestre para auditoria, bloqueio e saneamento de itens base.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleTriggerBulkCuration} className={`${styles.btnOutline} ${styles.btnRefreshGreen}`}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Forçar Fila de Cura ({kpis.linksQuebrados})
          </button>
          <button onClick={() => handleOpenForm(null)} className={styles.btnGold}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Cadastrar Presente
          </button>
        </div>
      </div>

      {/* Top Level KPIs Row */}
      <div className={styles.kpiGrid}>
        <div className={styles.cardKpi}>
          <span className={styles.kpiTitle}>Total no Acervo SaaS</span>
          <div className={styles.kpiValue}>{loading ? '...' : kpis.totalItems}</div>
          <span className={styles.kpiFoot}>Itens homologados e disponíveis</span>
        </div>
        <div className={styles.cardKpi}>
          <span className={styles.kpiTitle}>Amazon Afiliados</span>
          <div className={styles.kpiValue}>{loading ? '...' : kpis.amazonCount}</div>
          <span className={styles.kpiFoot}>URLs ativas direcionadas</span>
        </div>
        <div className={styles.cardKpi}>
          <span className={styles.kpiTitle}>Pausados do Catálogo</span>
          <div className={styles.kpiValue} style={{ color: '#d1d5db' }}>{loading ? '...' : kpis.pausados}</div>
          <span className={styles.kpiFoot}>Indisponíveis para novos convites</span>
        </div>
        <div className={styles.cardKpi}>
          <span className={styles.kpiTitle}>Links Quebrados</span>
          <div className={styles.kpiValue} style={{ color: '#f59e0b' }}>{loading ? '...' : kpis.linksQuebrados}</div>
          <span className={styles.kpiFoot}>Itens com pendências na Fila de Cura</span>
        </div>
      </div>

      {/* Top Tabs Selector */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'catalogo' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo SaaS Mestre
          <span className={styles.tabBadge}>{kpis.totalItems}</span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'candidatos' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('candidatos')}
        >
          Candidatos ao Catálogo
          {kpis.totalCandidatos > 0 && <span className={styles.tabBadge} style={{ background: '#f59e0b', color: '#000' }}>{kpis.totalCandidatos}</span>}
        </button>
      </div>

      {activeTab === 'catalogo' && (
        <>
          {/* Grid Controls */}
          <div className={styles.controlsRow}>
        <input
          type="text"
          className={styles.searchBox}
          placeholder="Procurar por nome, loja ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.viewToggle}>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            title="Visualização em Grade (Padrão)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button 
            onClick={() => setViewMode('table')} 
            className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
            title="Visualização em Tabela"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* Renders loader if fetching */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Carregando catálogo mestre...</div>
      ) : filteredPresentes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px', color: '#555' }}>
          Nenhum item localizado para os filtros definidos.
        </div>
      ) : viewMode === 'grid' ? (
        /* =======================================
           🃏 RENDER CARDS GRID (DARK MODE PRESET)
           ======================================= */
        <>
        <div className={styles.gridContainer}>
          {filteredPresentes.slice(0, visibleCatalogo).map((item, index) => {
            const isBroken = !item.link_varejo_padrao || item.link_varejo_padrao.includes('roto');
            return (
              <motion.div 
                key={item.id} 
                className={styles.giftCard}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index % 10) * 0.05 }}
              >
                <div className={styles.cardImgWrap}>
                  {/* Floating badges */}
                  <div className={styles.badgeOriginFloat}>
                    {item.parceiro_nome || 'Indireto'}
                  </div>
                  <div className={styles.badgeStatusFloat}>
                    <span className={`${styles.badgeStatus} ${item.is_paused ? styles.statusPaused : isBroken ? styles.statusBroken : styles.statusActive}`}>
                      {item.is_paused ? 'PAUSADO' : isBroken ? 'LINK QUEBRADO' : 'ATIVO'}
                    </span>
                  </div>
                  
                  {/* Blur Details Overlay Hover Trigger */}
                  <div className={styles.viewDetailsOverlay}>
                    <button 
                      onClick={() => { setSelectedItem(item); setActiveModal('view'); }} 
                      className={styles.detailsBtn}
                    >
                      Ver Mais
                    </button>
                  </div>

                  {/* Fallback standard component */}
                  <img
                    src={item.imagem_url || ''}
                    alt={item.nome}
                    className={styles.cardImg}
                    onError={handleImgError}
                  />
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{item.nome}</div>
                  <div className={styles.cardPrice}>
                    {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  
                  <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {item.categoria_nome || 'Sem Categoria'}
                  </div>

                  {/* Action Buttons Group in Cards Footer */}
                  <div className={styles.cardMeta}>
                    <div className={styles.weddingsCount} title="Casamentos Ativos usando este item no momento">
                      🛒 {item.casamentos_ativos || 0} listas
                    </div>
                    <div className={styles.actionsRow}>
                      <button 
                        onClick={() => handleSingleCurate(item)}
                        className={`${styles.actionBtnGray} ${isBroken ? styles.curaSpecial : ''}`}
                        title="Forçar Envio para Fila de Cura Autônoma"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleOpenForm(item)}
                        className={styles.actionBtnGray}
                        title="Editar campos"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleTogglePause(item)}
                        className={styles.actionBtnGray}
                        title={item.is_paused ? 'Ativar item' : 'Pausar importações'}
                      >
                        {item.is_paused ? (
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="18" y2="18"></line><line x1="6" y1="6" x2="6" y2="18"></line></svg>
                        )}
                      </button>
                      <button 
                        onClick={() => { setSelectedItem(item); setActiveModal('delete'); }}
                        className={`${styles.actionBtnGray} ${styles.danger}`}
                        title="Excluir item do SaaS"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {filteredPresentes.length > visibleCatalogo && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', paddingBottom: '3rem' }}>
            <button 
              className={styles.btnGold} 
              style={{ padding: '12px 40px' }}
              onClick={() => setVisibleCatalogo(prev => prev + 10)}
            >
              Ver Mais 10 Itens
            </button>
          </div>
        )}
      </>
    ) : (
      /* =======================================
         📊 RENDER TABLE ROW (COMPACT VISUAL)
         ======================================= */
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto Base</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Parceiro</th>
              <th>Casamentos Ativos</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPresentes.slice(0, visibleCatalogo).map((item, index) => {
              const isBroken = !item.link_varejo_padrao || item.link_varejo_padrao.includes('roto');
              return (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (index % 10) * 0.03 }}
                >
                    <td>
                      <div className={styles.itemCell}>
                        <img 
                          src={item.imagem_url || ''} 
                          alt={item.nome} 
                          className={styles.thumbMini} 
                          onError={handleImgError} 
                        />
                        <div>
                          <span className={styles.itemName}>{item.nome}</span>
                          <span className={styles.itemIdTag}>{item.categoria_nome || 'Sem categoria'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badgeStatus} ${item.is_paused ? styles.statusPaused : isBroken ? styles.statusBroken : styles.statusActive}`}>
                        {item.is_paused ? 'PAUSADO' : isBroken ? 'LINK QUEBRADO' : 'ATIVO'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.priceText}>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: '#888' }}>
                        {item.parceiro_nome || 'DIRETO'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.weddingsCount}>
                        {item.casamentos_ativos || 0} listas
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsRow} style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleSingleCurate(item)}
                          className={`${styles.actionBtnGray} ${isBroken ? styles.curaSpecial : ''}`}
                          title="Enviar para Fila de Cura Autônoma"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(item); setActiveModal('view'); }}
                          className={styles.actionBtnGray}
                          title="Visualizar detalhes"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button 
                          onClick={() => handleOpenForm(item)}
                          className={styles.actionBtnGray}
                          title="Editar campos"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleTogglePause(item)}
                          className={styles.actionBtnGray}
                          title={item.is_paused ? 'Reativar' : 'Pausar'}
                        >
                          {item.is_paused ? (
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="18" y2="18"></line><line x1="6" y1="6" x2="6" y2="18"></line></svg>
                          )}
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(item); setActiveModal('delete'); }}
                          className={`${styles.actionBtnGray} ${styles.danger}`}
                          title="Excluir globalmente"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                </motion.tr>
              );
            })}
            </tbody>
          </table>
          
          {filteredPresentes.length > visibleCatalogo && (
            <div style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className={styles.btnOutline} 
                onClick={() => setVisibleCatalogo(prev => prev + 10)}
              >
                Carregar mais 10 resultados
              </button>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* =======================================
         🏷️ APROVAÇÃO DE CANDIDATOS AO CATÁLOGO
         ======================================= */}
      {activeTab === 'candidatos' && (
        <>
          {/* Grid Controls para Candidatos */}
          <div className={styles.controlsRow}>
            <input
              type="text"
              className={styles.searchBox}
              placeholder="Procurar nos presentes criados em casamentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '380px' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>Carregando candidatos locais...</div>
          ) : filteredCandidatos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '16px', color: '#555' }}>
              Nenhum presente candidato localizado para os termos pesquisados.
            </div>
          ) : (
            <>
            <div className={styles.gridContainer}>
          {filteredCandidatos.slice(0, visibleCandidatos).map((item, index) => (
            <motion.div 
              key={item.id} 
              className={styles.giftCard}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: (index % 10) * 0.05 }}
            >
                  <div className={styles.cardImgWrap}>
                    {/* Floating Origin & Candidate Badges matching main system */}
                    <div className={styles.badgeOriginFloat} title={`Casamento: ${item.evento?.nome || 'Desconhecido'}`}>
                      💍 {item.evento?.nome || 'Casamento Local'}
                    </div>
                    <div className={styles.badgeStatusFloat}>
                      <span className={`${styles.badgeStatus} ${styles.statusBroken}`} style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b' }}>
                        CANDIDATO
                      </span>
                    </div>
                    
                    {/* Blur Details Overlay Hover Trigger */}
                    <div className={styles.viewDetailsOverlay}>
                      <button 
                        onClick={() => { 
                          setSelectedItem({
                            ...item,
                            parceiro_nome: 'CURADORIA MANUAL',
                            link_varejo_padrao: item.link_externo
                          }); 
                          setActiveModal('view'); 
                        }} 
                        className={styles.detailsBtn}
                      >
                        Ver Mais
                      </button>
                    </div>

                    <img
                      src={item.imagem_url || ''}
                      alt={item.nome}
                      onError={handleImgError}
                      className={styles.cardImg}
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>{item.nome}</div>
                    <div className={styles.cardPrice}>
                      {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    
                    <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '0.75rem' }}>
                      {item.categoria?.nome || 'Sem Categoria'}
                    </div>

                    {/* Subtle description with standard typography constraints */}
                    <p style={{ fontSize: '0.75rem', color: '#555', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '32px', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                      {item.descricao || 'Sem descrição adicional cadastrada.'}
                    </p>
                    
                    {/* Action Area matching standard cardMeta metrics row */}
                    <div className={styles.cardMeta} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1.2rem', width: '100%' }}>
                      <button 
                        onClick={() => handleApproveCandidate(item.id)} 
                        className={styles.btnGold}
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '12px 0', borderRadius: '10px', minHeight: '44px' }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Aprovar no Catálogo
                      </button>
                    </div>
                  </div>
              </motion.div>
          ))}
        </div>
        
        {filteredCandidatos.length > visibleCandidatos && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', paddingBottom: '3rem' }}>
            <button 
              className={styles.btnGold} 
              onClick={() => setVisibleCandidatos(prev => prev + 10)}
            >
              Ver mais Candidatos
            </button>
          </div>
        )}
      </>
    )}
  </>
)}

      {/* =======================================
         📢 MODAL SYSTEM RENDERING
         ======================================= */}
      
      {/* MODAL 1: VIEW DETAILS (LIGHT GLASS ELEMENTS ON BLACK) */}
      {activeModal === 'view' && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Ficha do Produto Base</h2>
            <p>Visualização estendida para auditoria de parceiros e metadados.</p>
            
            <div className={styles.detailGrid}>
              <img 
                src={selectedItem.imagem_url || ''} 
                alt={selectedItem.nome} 
                className={styles.detailImage} 
                onError={handleImgError}
              />
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{selectedItem.nome}</h3>
                <div className={styles.detailPrice}>
                  {Number(selectedItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p style={{ color: '#888', fontSize: '0.8rem', minHeight: '60px' }}>{selectedItem.descricao || 'Sem descrição cadastrada.'}</p>
              </div>
            </div>

            <div className={styles.detailMetaBox}>
              <div>
                <span className={styles.metaLabel}>Categoria Base</span>
                <span className={styles.metaValue}>{selectedItem.categoria_nome || 'Sem Categoria'}</span>
              </div>
              <div>
                <span className={styles.metaLabel}>Varejista Principal</span>
                <span className={styles.metaValue} style={{ color: '#C5A059' }}>{selectedItem.parceiro_nome || 'DIRETO'}</span>
              </div>
              <div>
                <span className={styles.metaLabel}>Casamentos Ativos</span>
                <span className={styles.metaValue}>{selectedItem.casamentos_ativos || 0} listas utilizam</span>
              </div>
              <div>
                <span className={styles.metaLabel}>Histórico Recebidos</span>
                <span className={styles.metaValue} style={{ color: '#10b981' }}>{selectedItem.total_recebidos || 0} presentes dados</span>
              </div>
            </div>

            <div>
              <span className={styles.metaLabel}>URL de Afiliado Vinculada</span>
              <div className={styles.externalLinkBoxModal}>
                {selectedItem.link_varejo_padrao || 'Nenhuma URL cadastrada'}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setActiveModal(null)} className={styles.btnModalCancel}>
                Fechar Painel
              </button>
              <button onClick={() => { setActiveModal('form'); handleOpenForm(selectedItem); }} className={styles.btnModalConfirm}>
                Editar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE & EDIT FORM */}
      {activeModal === 'form' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <h2>{formState.id ? 'Editar Presente Base' : 'Novo Presente Base Global'}</h2>
            <p>Insira os dados homologados para distribuir este item no acervo para todos os noivos.</p>
            
            <form onSubmit={handleSaveForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label>Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Ex: Cafeteira Nespresso Pixie"
                    value={formState.nome}
                    onChange={e => setFormState({ ...formState, nome: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Categoria *</label>
                  <select
                    required
                    className={styles.formSelect}
                    value={formState.categoria_id}
                    onChange={e => setFormState({ ...formState, categoria_id: e.target.value })}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Preço Atual (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className={styles.formInput}
                    placeholder="0,00"
                    value={formState.preco}
                    onChange={e => setFormState({ ...formState, preco: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Preço &quot;De&quot; (R$) - Opcional</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.formInput}
                    placeholder="Ex: 1200,00"
                    value={formState.preco_de}
                    onChange={e => setFormState({ ...formState, preco_de: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>URL da Imagem</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://..."
                    value={formState.imagem_url}
                    onChange={e => setFormState({ ...formState, imagem_url: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nome do Varejista (Parceiro)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ex: Amazon, Magalu..."
                    value={formState.parceiro_nome}
                    onChange={e => setFormState({ ...formState, parceiro_nome: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                <label>Link Direto para Compra (Varejo)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="https://www.amazon.com.br/..."
                  value={formState.link_varejo_padrao}
                  onChange={e => setFormState({ ...formState, link_varejo_padrao: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Descrição do Item</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Descrição complementar que aparecerá para os noivos e convidados..."
                  value={formState.descricao}
                  onChange={e => setFormState({ ...formState, descricao: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1rem 0' }}>
                <input
                  type="checkbox"
                  id="formPaused"
                  checked={formState.is_paused}
                  onChange={e => setFormState({ ...formState, is_paused: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="formPaused" style={{ fontSize: '0.8rem', color: '#aaa', cursor: 'pointer', userSelect: 'none' }}>
                  Pausar Disponibilidade (Impede que este item apareça nas vitrines para importação)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.btnModalCancel}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnModalConfirm}>
                  {formState.id ? 'Salvar Alterações' : 'Cadastrar Presente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SAFE GLOBAL DELETE CONFIRMATION */}
      {activeModal === 'delete' && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fca5a5' }}>Atenção: Exclusão Global</h2>
            <p>Você está prestes a remover o produto <strong>&quot;{selectedItem.nome}&quot;</strong> permanentemente de toda a plataforma InviteEvent.</p>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>🛡️ MECANISMO DE AUDITORIA E SEGURANÇA DE DADOS ATIVO:</p>
              <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                Se este item já recebeu comprovantes de PIX ou compras reais por convidados em qualquer casamento, o sistema irá **arquivar automaticamente** o registro (Soft-Delete), preservando extratos e mantendo o histórico inalterado. Caso contrário, o item será excluído permanentemente.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setActiveModal(null)} className={styles.btnModalCancel}>
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} className={styles.btnModalDanger}>
                Entendo, Executar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================
         🍞 TOAST NOTIFICATION SYSTEM
         ======================================= */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            {toast.type === 'success' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
