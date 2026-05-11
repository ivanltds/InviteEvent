'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminPresentes.module.css';
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import { useEvent } from '@/lib/contexts/EventContext';

interface Presente {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  imagem_url: string;
  status: 'disponivel' | 'reservado' | 'pausado';
  quantidade_total: number;
  quantidade_reservada: number;
  link_externo?: string;
}

interface ComprovanteJoin {
  id: string;
  presente_id: string;
  convite_id: string;
  convidado_nome: string;
  url_comprovante: string;
  created_at: string;
  presente: { nome: string, preco: number };
  convite: { nome_principal: string };
}

export default function AdminPresentes() {
  const { currentEvent, loading: eventLoading } = useEvent();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'recebidos'>('catalogo');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid'); // Default to beautiful cards
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [comprovantes, setComprovantes] = useState<ComprovanteJoin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & UX States
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Presente | null>(null);
  const [detailItem, setDetailItem] = useState<Presente | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<'presente' | 'comprovante'>('presente');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Forms & Dirty states
  const [formData, setFormData] = useState({ 
    nome: '', 
    preco: 0, 
    descricao: '', 
    imagem_url: '', 
    status: 'disponivel' as Presente['status'],
    quantidade_total: 1,
    link_externo: '' 
  });
  const [originalDataStr, setOriginalDataStr] = useState<string>('');
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const bypassGuardRef = useRef(false);

  const isDirty = useMemo(() => {
    if (!isAdding) return false; // Only track dirty if adding/editing modal is open
    return originalDataStr !== JSON.stringify(formData);
  }, [formData, originalDataStr, isAdding]);

  // Navigation Lock Interceptor
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && !target.href.includes('#') && !target.target) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavUrl(target.href);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassGuardRef.current) return; // Ignora se já tomamos a decisão
      e.preventDefault();
      return (e.returnValue = 'Você tem alterações pendentes na edição do presente. Deseja mesmo sair?');
    };

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const fetchPresentes = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('presentes')
      .select('*')
      .eq('evento_id', currentEvent.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setPresentes(data as Presente[]);
    }
    setLoading(false);
  };

  const fetchComprovantes = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('comprovantes')
      .select('*, presente:presentes!inner(nome, preco, evento_id), convite:convites(nome_principal)')
      .eq('presente.evento_id', currentEvent.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setComprovantes(data as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentEvent) {
      fetchPresentes();
      fetchComprovantes();
    }
  }, [currentEvent]);

  useEffect(() => {
    if (currentEvent) {
      if (activeTab === 'catalogo') fetchPresentes();
      else fetchComprovantes();
    }
  }, [activeTab]);

  const stats = useMemo(() => {
    const totalValorArrecadado = comprovantes.reduce((acc, comp) => acc + (Number(comp.presente?.preco) || 0), 0);
    const itemsRestantes = presentes.reduce((acc, p) => acc + (p.quantidade_total - p.quantidade_reservada), 0);
    const totalItensPresentes = presentes.length;
    return { totalValorArrecadado, itemsRestantes, totalItensPresentes };
  }, [presentes, comprovantes]);

  const startAddNew = () => {
    const init = { nome: '', preco: 0, descricao: '', imagem_url: '', status: 'disponivel' as const, quantidade_total: 1, link_externo: '' };
    setFormData(init);
    setOriginalDataStr(JSON.stringify(init));
    setEditingItem(null);
    setIsAdding(true);
  };

  const handleEditClick = (item: Presente) => {
    setDetailItem(null); // Close detail modal if open
    setEditingItem(item);
    const init = {
      nome: item.nome,
      preco: item.preco,
      descricao: item.descricao || '',
      imagem_url: item.imagem_url || '',
      status: item.status,
      quantidade_total: item.quantidade_total,
      link_externo: item.link_externo || ''
    };
    setFormData(init);
    setOriginalDataStr(JSON.stringify(init));
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!currentEvent) return;
    setLoading(true);
    
    const qtyTotal = Number(formData.quantidade_total);
    const qtyReservada = editingItem ? editingItem.quantidade_reservada : 0;
    let newStatus = formData.status;
    if (newStatus !== 'pausado') {
      newStatus = qtyReservada >= qtyTotal ? 'reservado' : 'disponivel';
    }

    const payload = {
      nome: formData.nome.trim(),
      preco: Number(formData.preco),
      descricao: formData.descricao.trim(),
      imagem_url: formData.imagem_url,
      status: newStatus,
      quantidade_total: qtyTotal,
      link_externo: formData.link_externo.trim() || null,
      evento_id: currentEvent.id
    };

    if (editingItem) {
      const { data, error } = await supabase.from('presentes').update(payload).eq('id', editingItem.id).select();
      if (!error && data) {
        setPresentes(presentes.map(p => p.id === editingItem.id ? (data[0] as Presente) : p));
        setIsAdding(false);
        triggerToast('Item atualizado com sucesso.');
      } else {
        triggerToast('Erro ao atualizar item.');
      }
    } else {
      const { data, error } = await supabase.from('presentes').insert([payload]).select();
      if (!error && data) {
        setPresentes(prev => [data[0] as Presente, ...prev]);
        setIsAdding(false);
        triggerToast('Novo item adicionado.');
      } else {
        triggerToast('Erro ao adicionar item.');
      }
    }
    setLoading(false);
    if (pendingNavUrl) {
      bypassGuardRef.current = true; // Força a desativação do bloqueio
      window.location.href = pendingNavUrl;
    }
  };

  const discardChanges = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleDiscardAndLeave = () => {
    if (pendingNavUrl) {
      bypassGuardRef.current = true; // Libera a trava do navegador
      window.location.href = pendingNavUrl;
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = currentStatus === 'disponivel' ? 'pausado' : 'disponivel';
    const { error } = await supabase.from('presentes').update({ status: nextStatus }).eq('id', id);
    if (!error) {
      setPresentes(presentes.map(p => p.id === id ? { ...p, status: nextStatus as Presente['status'] } : p));
      triggerToast(nextStatus === 'pausado' ? 'Item pausado com sucesso.' : 'Item reativado com sucesso.');
    }
  };

  const openDeleteModal = (id: string, type: 'presente' | 'comprovante', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDeleteId(id);
    setDeleteTargetType(type);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const table = deleteTargetType === 'presente' ? 'presentes' : 'comprovantes';
    const { error } = await supabase.from(table).delete().eq('id', confirmDeleteId);
    if (!error) {
      if (deleteTargetType === 'presente') setPresentes(presentes.filter(p => p.id !== confirmDeleteId));
      else setComprovantes(comprovantes.filter(c => c.id !== confirmDeleteId));
      triggerToast('Excluído com sucesso.');
    }
    setConfirmDeleteId(null);
    setDetailItem(null);
  };

  if (eventLoading) return <div className={styles.loading}>Processando...</div>;
  if (!currentEvent) return <main className={styles.adminMain}><h1>Presentes</h1><p>Selecione um evento ativo.</p></main>;

  return (
    <main className={styles.adminMain}>
      <header className={styles.adminHeader}>
        <div>
          <h1>Lista de Presentes</h1>
          <p style={{ color: '#64748b' }}>Controle a vitrine e visualize os presentes arrecadados.</p>
        </div>
        <button className={styles.addBtn} onClick={startAddNew}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Presente
        </button>
      </header>

      {/* Stats Dashboard */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span>Total Arrecadado</span>
          <strong>{stats.totalValorArrecadado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Itens no Catálogo</span>
          <strong>{stats.totalItensPresentes}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Estoque Disponível</span>
          <strong>{stats.itemsRestantes}</strong>
        </div>
      </div>

      {/* Top Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'catalogo' ? styles.activeTab : ''}`} onClick={() => setActiveTab('catalogo')}>Gestão do Catálogo</button>
        <button className={`${styles.tabBtn} ${activeTab === 'recebidos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('recebidos')}>Comprovantes Recebidos</button>
      </div>

      {/* View Controls (Grid/List) for Catalog only */}
      {activeTab === 'catalogo' && (
        <div className={styles.controlsRow}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Visualizando {presentes.length} itens</span>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewType === 'grid' ? styles.active : ''}`} 
              onClick={() => setViewType('grid')}
              title="Visualização em Cards"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewType === 'list' ? styles.active : ''}`} 
              onClick={() => setViewType('list')}
              title="Visualização em Lista"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Carregando dados...</div>
      ) : activeTab === 'catalogo' ? (
        viewType === 'grid' ? (
          // CARD VIEW
          <div className={styles.gridContainer}>
            {presentes.map(item => (
              <motion.div 
                key={item.id} 
                className={styles.giftCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setDetailItem(item)}
              >
                <div className={styles.cardImageWrapper}>
                  <img src={item.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&auto=format&fit=crop'} alt={item.nome} className={styles.cardImage} />
                  <span className={`${styles.cardStatusBadge} ${styles[item.status]}`}>
                    {item.status === 'reservado' && item.quantidade_reservada < item.quantidade_total ? 'Pausado' : item.status}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{item.nome}</h3>
                  <span className={styles.cardPrice}>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <div className={styles.cardMeta}>
                    <span className={styles.stockLabel}>Estoque: <strong>{item.quantidade_total - item.quantidade_reservada} / {item.quantidade_total}</strong></span>
                    <div className={styles.actionsCell}>
                      <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} data-tooltip="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className={styles.successBtn} onClick={(e) => handleToggleStatus(item.id, item.status, e)} data-tooltip="Pausar/Ativar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                      </button>
                      <button className={styles.deleteBtn} onClick={(e) => openDeleteModal(item.id, 'presente', e)} data-tooltip="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {presentes.length === 0 && <div className={styles.empty}>Nenhum presente no catálogo.</div>}
          </div>
        ) : (
          // LIST VIEW
          <section className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {presentes.map((item) => (
                  <tr key={item.id} onClick={() => setDetailItem(item)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className={styles.itemCell}>
                        <img src={item.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=100&fit=crop'} alt="" className={styles.miniThumb} />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.nome}</span>
                          <span className={styles.itemSub}>{item.descricao?.substring(0, 30)}...</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>{item.quantidade_total - item.quantidade_reservada} / {item.quantidade_total}</td>
                    <td><span className={`${styles.statusBadge} ${styles[item.status]}`}>{item.status}</span></td>
                    <td className={styles.actionsCell}>
                      <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} data-tooltip="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                      <button className={styles.successBtn} onClick={(e) => handleToggleStatus(item.id, item.status, e)} data-tooltip="Pausar/Ativar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></button>
                      <button className={styles.deleteBtn} onClick={(e) => openDeleteModal(item.id, 'presente', e)} data-tooltip="Remover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      ) : (
        // COMPROVANTES (Always List)
        <section className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>Data</th><th>Item</th><th>Convidado</th><th>Comprovante</th><th>Ações</th></tr></thead>
            <tbody>
              {comprovantes.map((comp) => (
                <tr key={comp.id}>
                  <td>{new Date(comp.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 600 }}>{comp.presente?.nome}</td>
                  <td><div className={styles.guestInfo}><strong>{comp.convidado_nome}</strong>{comp.convite && <span className={styles.inviteTag}>{comp.convite.nome_principal}</span>}</div></td>
                  <td><a href={comp.url_comprovante} target="_blank" rel="noopener noreferrer"><img src={comp.url_comprovante} alt="Comprovante" className={styles.comprovanteThumb} /></a></td>
                  <td><button className={styles.deleteBtn} onClick={() => openDeleteModal(comp.id, 'comprovante')} data-tooltip="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Floating Action Bar (Used if changes are detected during ADDING/EDITING) */}
      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className={styles.floatingBar}
          >
            <div className={styles.dirtyText}>
              <span className={styles.dirtyIndicator}></span>
              Alterações detectadas
            </div>
            <div className={styles.floatActions}>
              <button type="button" className={styles.secondaryFloatBtn} onClick={() => setFormData(JSON.parse(originalDataStr))}>Descartar</button>
              <button type="button" className={styles.primaryFloatBtn} onClick={handleSave}>Salvar Agora</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: DETAIL PREVIEW */}
      <AnimatePresence>
        {detailItem && (
          <div className={styles.modalOverlay} onClick={() => setDetailItem(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modal} style={{ maxWidth: '700px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.detailGrid}>
                <img src={detailItem.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&fit=crop'} alt="" className={styles.detailImage} />
                <div className={styles.detailText}>
                  <h2>{detailItem.nome}</h2>
                  <div className={styles.detailPrice}>{Number(detailItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  <p className={styles.detailDesc}>{detailItem.descricao || 'Sem descrição registrada para este presente.'}</p>
                  
                  <div className={styles.detailMetaItem}>
                    <span>Disponibilidade</span>
                    <span>{detailItem.quantidade_total - detailItem.quantidade_reservada} de {detailItem.quantidade_total} unidades</span>
                  </div>
                  
                  {detailItem.link_externo && (
                    <div className={styles.detailMetaItem}>
                      <span>Link da Loja</span>
                      <a href={detailItem.link_externo} target="_blank" style={{ color: 'var(--admin-accent)' }}>Visitar Loja</a>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDetailItem(null)}>Fechar</button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className={styles.secondaryFloatBtn} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c' }} onClick={() => openDeleteModal(detailItem.id, 'presente')}>Excluir</button>
                  <button className={styles.saveBtn} onClick={() => handleEditClick(detailItem)}>Editar Item</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: ADD / EDIT FORM */}
      <AnimatePresence>
        {isAdding && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className={styles.modal}
            >
              <h2>{editingItem ? 'Ajustar Presente' : 'Novo Presente'}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label>Nome do Presente</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Preço Estimado (R$)</label>
                  <input type="number" value={formData.preco || ''} onChange={(e) => setFormData({...formData, preco: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Quantidade Total</label>
                  <input type="number" min="1" value={formData.quantidade_total} onChange={(e) => setFormData({...formData, quantidade_total: parseInt(e.target.value) || 1})} />
                </div>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label>Descrição</label>
                  <textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
                </div>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label>Link Loja (Opcional)</label>
                  <input type="url" value={formData.link_externo} onChange={(e) => setFormData({...formData, link_externo: e.target.value})} />
                </div>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label>Foto do Presente</label>
                  <CldUploadWidget uploadPreset="invite_preset" onSuccess={(result: any) => { const u = result?.info?.secure_url; if(u) setFormData(p => ({...p, imagem_url: u})) }}>
                    {({ open }) => <button type="button" className={styles.uploadBtn} onClick={() => open()}>Subir Nova Foto</button>}
                  </CldUploadWidget>
                  {formData.imagem_url && <div className={styles.previewImgContainer}><img src={formData.imagem_url} className={styles.previewImg} /></div>}
                </div>
              </div>
              <div className={styles.modalActions} style={{ gridTemplateColumns: '1fr' }}>
                {!isDirty ? (
                   <button className={styles.cancelBtn} onClick={discardChanges}>Fechar sem alterações</button>
                ) : (
                   <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>Use a barra inferior para salvar ou descartar alterações.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: BLOCKING CONFIRM ON EXIT */}
      <AnimatePresence>
        {pendingNavUrl && (
          <div className={styles.modalOverlay}>
            <motion.div className={styles.modal} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '450px', textAlign: 'center' }}>
              <h3>Salvar Alterações?</h3>
              <p style={{ color: '#64748b', margin: '1rem 0 2rem' }}>Você tem modificações pendentes neste presente. Como deseja proceder?</p>
              <button className={styles.modalPrimaryBtn} onClick={handleSave}>Salvar e Continuar</button>
              <button className={styles.modalSecondaryBtn} onClick={handleDiscardAndLeave}>Descartar Alterações</button>
              <button className={styles.modalCancelBtn} onClick={() => setPendingNavUrl(null)}>Permanecer e Editar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Delete */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
            <motion.div 
              className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ color: 'var(--admin-danger)' }}>Confirmar Exclusão</h2>
              <p style={{ color: '#64748b', margin: '1rem 0 2rem' }}>Esta ação não pode ser desfeita. Deseja continuar?</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.cancelBtn} style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className={styles.saveBtn} style={{ flex: 1, background: 'var(--admin-danger)' }} onClick={executeDelete}>Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={styles.toast}>
            <div className={styles.toastIcon}>✓</div>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
