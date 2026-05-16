'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Award, Star, Gift, 
  Trash2, Edit, ExternalLink, 
  ChevronRight, Sparkles, Filter, 
  Plus, Check, Copy, Share2, Search, X,
  Palmtree, GlassWater, PartyPopper, Coffee, Plane, Music, Smile, Camera
} from 'lucide-react';
import styles from './AdminPresentes.module.css';
import { CldUploadWidget } from 'next-cloudinary';
import { useEvent } from '@/lib/contexts/EventContext';
import { giftService } from '@/lib/services/giftService';
import { SearchControl } from '@/components/ui/SearchControl';
import { PresenteCategoria, PresenteBase } from '@/lib/types/database';

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
  categoria_id?: string | null;
  base_id?: string | null;
  categoria?: { nome: string } | null;
  presentes_locks?: {
    id: string;
    expira_em: string;
    session_id: string;
    convite_id?: string;
    convite?: { nome_principal: string } | null;
  }[];
  permite_cotas?: boolean;
  total_cotas?: number | null;
  cotas_compradas?: number;
  is_sonho_casal?: boolean;
  highlight_label?: string | null;
  highlight_icon?: string | null;
}

interface UnifiedSuggestion {
  origin_id: string;
  type: 'base' | 'custom';
  nome: string;
  preco: number;
  descricao: string;
  imagem_url: string;
  categoria_id: string;
  categoria_nome: string | null;
  link_externo: string | null;
  total_clicks: number;
  total_conversions: number;
  popularity_score: number;
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
  const [activeTab, setActiveTab] = useState<'catalogo' | 'sugestoes' | 'recebidos'>('catalogo');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid'); // Default to beautiful cards
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [comprovantes, setComprovantes] = useState<ComprovanteJoin[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NOVOS ESTADOS DA FUNDAÇÃO SMART GIFT ---
  const [baseGifts, setBaseGifts] = useState<UnifiedSuggestion[]>([]);
  const [categories, setCategories] = useState<PresenteCategoria[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('todos');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [detailBaseItem, setDetailBaseItem] = useState<UnifiedSuggestion | null>(null);
  const [loadingBase, setLoadingBase] = useState(false);
  const [search, setSearch] = useState('');
  const [showMentor, setShowMentor] = useState(true);
  
  // --- PAGINAÇÃO PROGRESSIVA (10 em 10) ---
  const [visibleCatalogo, setVisibleCatalogo] = useState(10);
  const [visibleSugestoes, setVisibleSugestoes] = useState(10);
  const [visibleRecebidos, setVisibleRecebidos] = useState(10);

  // --- MENTOR DE CARINHO LOGIC (PRD-015) ---
  const mentorSuggestions = useMemo(() => {
    if (!showMentor) return [];
    return presentes.filter(p => 
      p.preco >= 500 && 
      !p.permite_cotas && 
      p.status === 'disponivel' &&
      p.id !== 'simular-roto' // Evita mock
    );
  }, [presentes, showMentor]);

  const handleApplyMentor = async () => {
    if (mentorSuggestions.length === 0) return;
    
    setLoading(true);
    let successCount = 0;
    
    for (const item of mentorSuggestions) {
      // Sugerimos dividir em cotas de ~R$ 100 - R$ 250
      const suggestedCotas = Math.max(2, Math.floor(item.preco / 150));
      const { success } = await giftService.updateGift(item.id, {
        permite_cotas: true,
        total_cotas: suggestedCotas,
        quantidade_total: 1
      });
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      triggerToast(`✨ Sucesso! ${successCount} presentes foram fracionados para facilitar a compra pelos convidados.`);
      fetchPresentes();
    }
    setShowMentor(false);
    setLoading(false);
  };

  // Filtros de Busca Dinâmicos (UX Reativa)
  const filteredPresentes = useMemo(() => {
    const q = search.toLowerCase();
    return presentes.filter(item => 
      item.nome?.toLowerCase().includes(q) || 
      item.descricao?.toLowerCase().includes(q) ||
      item.categoria?.nome?.toLowerCase().includes(q)
    );
  }, [presentes, search]);

  const filteredBaseGifts = useMemo(() => {
    const q = search.toLowerCase();
    return baseGifts.filter(item => 
      item.nome?.toLowerCase().includes(q) || 
      item.descricao?.toLowerCase().includes(q) ||
      item.categoria_nome?.toLowerCase().includes(q)
    );
  }, [baseGifts, search]);

  const filteredComprovantes = useMemo(() => {
    const q = search.toLowerCase();
    return comprovantes.filter(item => 
      item.presente?.nome?.toLowerCase().includes(q) || 
      item.convidado_nome?.toLowerCase().includes(q) ||
      item.convite?.nome_principal?.toLowerCase().includes(q)
    );
  }, [comprovantes, search]);
  
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
    link_externo: '',
    categoria_id: '',
    permite_cotas: false,
    total_cotas: 2,
    is_sonho_casal: false,
    highlight_label: '',
    highlight_icon: ''
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
    const data = await giftService.getAdminGifts(currentEvent.id);
    setPresentes(data as Presente[]);
    setLoading(false);
  };

  const fetchBaseData = async (catId?: string) => {
    if (!currentEvent) return;
    setLoadingBase(true);
    try {
      // 1. Carregar Categorias se ainda não tivermos
      if (categories.length === 0) {
        const cats = await giftService.getCategories();
        setCategories(cats);
      }
      
      // 2. Carregar Itens Unificados da categoria (SaaS + Customizados Populares)
      const items = await giftService.getUnifiedSuggestions(catId === 'todos' ? undefined : catId);
      setBaseGifts(items);
    } catch (err) {
      console.error("Erro no carregamento da vitrine unificada", err);
    } finally {
      setLoadingBase(false);
    }
  };

  const fetchComprovantes = async () => {
    if (!currentEvent) return;
    setLoading(true);
    const data = await giftService.getAdminComprovantes(currentEvent.id);
    setComprovantes(data as any[]);
    setLoading(false);
  };



  const handleImportGift = async (originId: string, type: 'base' | 'custom') => {
    if (!currentEvent) return;
    setImportingId(originId);
    
    const result = await giftService.importGiftFromUnified(originId, type, currentEvent.id);
    if (result.success && result.gift) {
      // Injetar localmente para atualizar visualmente o grid e contadores na hora
      const newGift: Presente = {
        ...result.gift,
        // Mapeia a categoria no formato esperado pela listagem original
        categoria: { nome: baseGifts.find(b => b.origin_id === originId)?.categoria_nome || 'Geral' }
      };
      
      setPresentes(prev => [newGift, ...prev]);
      triggerToast('✨ Presente adicionado à sua lista com sucesso!');
      setDetailBaseItem(null);
    } else {
      triggerToast('❌ Ocorreu um erro ao tentar importar o presente.');
    }
    setImportingId(null);
  };

  useEffect(() => {
    if (currentEvent) {
      fetchPresentes();
      fetchComprovantes();
      // Pré-carrega as categorias globais para popularem o modal de cadastro manual desde o D0
      giftService.getCategories().then(setCategories).catch(console.error);
    }
  }, [currentEvent]);

  useEffect(() => {
    if (currentEvent) {
      if (activeTab === 'catalogo') fetchPresentes();
      else if (activeTab === 'sugestoes') fetchBaseData(selectedCatId);
      else fetchComprovantes();
    }
  }, [activeTab, selectedCatId]);

  const clonedBaseIds = useMemo(() => {
    return new Set(presentes.map(p => p.base_id).filter(Boolean));
  }, [presentes]);

  // Adiciona pareamento por NOME para detectar itens cadastrados manualmente existentes no casamento
  const activeGiftNames = useMemo(() => {
    return new Set(presentes.map(p => p.nome?.trim().toLowerCase()).filter(Boolean));
  }, [presentes]);

  const recommendedItem = useMemo(() => {
    // Filtra itens já adicionados (tanto por ID base quanto por equivalência de nome manual)
    const available = baseGifts.filter(b => 
      !clonedBaseIds.has(b.origin_id) && 
      !activeGiftNames.has(b.nome?.trim().toLowerCase())
    );
    if (available.length === 0) return null;
    // A view de banco já calcula e ordena por popularidade matemática (cliques + conversões)
    return available[0];
  }, [baseGifts, clonedBaseIds, activeGiftNames]);


  const stats = useMemo(() => {
    const totalValorArrecadado = comprovantes.reduce((acc, comp) => acc + (Number(comp.presente?.preco) || 0), 0);
    const itemsRestantes = presentes.reduce((acc, p) => acc + (p.permite_cotas ? (p.total_cotas! - (p.cotas_compradas || 0)) : (p.quantidade_total - p.quantidade_reservada)), 0);
    const totalItensPresentes = presentes.length;
    const itensCotasCount = presentes.filter(p => p.permite_cotas).length;
    const totalCotasVendidas = presentes.reduce((acc, p) => acc + (p.permite_cotas ? (p.cotas_compradas || 0) : 0), 0);
    return { totalValorArrecadado, itemsRestantes, totalItensPresentes, itensCotasCount, totalCotasVendidas };
  }, [presentes, comprovantes]);

  const startAddNew = () => {
    const init = { 
      nome: '', 
      preco: 0, 
      descricao: '', 
      imagem_url: '', 
      status: 'disponivel' as const, 
      quantidade_total: 1, 
      link_externo: '',
      categoria_id: '',
      permite_cotas: false,
      total_cotas: 2,
      is_sonho_casal: false,
      highlight_label: '',
      highlight_icon: ''
    };
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
      link_externo: item.link_externo || '',
      categoria_id: item.categoria_id || '',
      permite_cotas: item.permite_cotas || false,
      total_cotas: item.total_cotas || 2,
      is_sonho_casal: item.is_sonho_casal || false,
      highlight_label: item.highlight_label || '',
      highlight_icon: item.highlight_icon || ''
    };
    setFormData(init);
    setOriginalDataStr(JSON.stringify(init));
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!currentEvent) return;
    setLoading(true);
    
    if (formData.permite_cotas) {
      const valPerCota = Number(formData.preco) / (Number(formData.total_cotas) || 1);
      if (valPerCota < 50) {
        triggerToast('❌ O valor de cada cota deve ser de no mínimo R$ 50,00.');
        setLoading(false);
        return;
      }
    }
    
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
      quantidade_total: formData.permite_cotas ? 1 : qtyTotal,
      link_externo: formData.link_externo.trim() || undefined,
      categoria_id: formData.categoria_id || null,
      evento_id: currentEvent.id,
      permite_cotas: formData.permite_cotas,
      total_cotas: formData.permite_cotas ? Number(formData.total_cotas) : null,
      is_sonho_casal: formData.is_sonho_casal,
      highlight_label: formData.highlight_label || null,
      highlight_icon: formData.highlight_icon || null
    };

    if (editingItem) {
      const { success, data, error } = await giftService.updateGiftWithReturn(editingItem.id, payload);

      if (success && data) {
        setPresentes(presentes.map(p => p.id === editingItem.id ? (data as Presente) : p));
        setIsAdding(false);
        triggerToast('✨ Item atualizado com sucesso.');
      } else {
        triggerToast('Erro ao atualizar item.');
      }
    } else {
      const { success, data, error } = await giftService.createGiftWithReturn(payload);

      if (success && data) {
        setPresentes(prev => [data as Presente, ...prev]);
        setIsAdding(false);
        triggerToast('✨ Novo item adicionado.');
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
    const { success } = await giftService.updateGift(id, { status: nextStatus as any });
    if (success) {
      setPresentes(presentes.map(p => p.id === id ? { ...p, status: nextStatus as Presente['status'] } : p));
      triggerToast(nextStatus === 'pausado' ? 'Item pausado com sucesso.' : 'Item reativado com sucesso.');
    }
  };

  const handleInlineQuotaToggle = async (id: string, currentPermite: boolean, price: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextPermite = !currentPermite;
    const nextTotalCotas = nextPermite ? 2 : null;

    if (nextPermite && (price / 2) < 50) {
      triggerToast('❌ Valor muito baixo para cotas (mínimo R$ 50,00/cota). Edite o item para ajustar.');
      return;
    }

    const { success } = await giftService.updateGift(id, { 
      permite_cotas: nextPermite, 
      total_cotas: nextTotalCotas,
      quantidade_total: nextPermite ? 1 : 1
    });

    if (success) {
      setPresentes(presentes.map(p => p.id === id ? { 
        ...p, 
        permite_cotas: nextPermite, 
        total_cotas: nextTotalCotas,
        quantidade_total: nextPermite ? 1 : p.quantidade_total
      } : p));
      triggerToast(nextPermite ? '🤝 Dividido em 2 cotas! Ajuste no botão Editar.' : '🔄 Retornado para formato Integral.');
    } else {
      triggerToast('❌ Erro ao atualizar formato de cotas.');
    }
  };

  const openDeleteModal = (id: string, type: 'presente' | 'comprovante', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDeleteId(id);
    setDeleteTargetType(type);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const { success } = deleteTargetType === 'presente'
      ? await giftService.deleteGift(confirmDeleteId)
      : await giftService.deleteComprovante(confirmDeleteId);

    if (success) {
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
          <span>Cotas Coletivas Ativas</span>
          <strong>{stats.itensCotasCount} itens</strong>
        </div>
        <div className={styles.statCard}>
          <span>Cotas Vendidas</span>
          <strong>{stats.totalCotasVendidas} total</strong>
        </div>
      </div>

      {/* Top Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'catalogo' ? styles.activeTab : ''}`} onClick={() => setActiveTab('catalogo')}>Gestão do Catálogo</button>
        <button className={`${styles.tabBtn} ${activeTab === 'sugestoes' ? styles.activeTab : ''}`} onClick={() => setActiveTab('sugestoes')}>Sugestões de Presentes</button>
        <button className={`${styles.tabBtn} ${activeTab === 'recebidos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('recebidos')}>Presentes Recebidos</button>
      </div>

      {/* PRD-015: Mentor de Carinho Banner */}
      <AnimatePresence>
        {activeTab === 'catalogo' && mentorSuggestions.length > 0 && (
          <motion.div 
            className={styles.mentorBanner}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: '2.5rem' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            <div className={styles.mentorContent}>
              <div className={styles.mentorIcon}>
                <Sparkles size={28} />
              </div>
              <div className={styles.mentorText}>
                <h3>Mentor de Carinho <span style={{ fontSize: '0.7rem', background: 'rgba(197, 160, 89, 0.1)', color: '#C5A059', padding: '4px 10px', borderRadius: '40px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SUGESTÃO SMART</span></h3>
                <p>
                  Identificamos <strong>{mentorSuggestions.length} presentes</strong> de alto valor que ainda não estão divididos em cotas. 
                  Fracionar esses itens facilita a participação dos convidados e aumenta suas chances de ganhar!
                </p>
              </div>
            </div>
            <div className={styles.mentorActions}>
              <button className={styles.mentorDismissBtn} onClick={() => setShowMentor(false)}>Agora não</button>
              <button className={styles.mentorApplyBtn} onClick={handleApplyMentor}>Fracionar Itens</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles de Grid Unificados (Derivados do Catálogo Global) */}
      <SearchControl
        placeholder={
          activeTab === 'catalogo' ? "Buscar por nome, descrição ou categoria..." :
          activeTab === 'sugestoes' ? "Buscar sugestões do sistema..." :
          "Buscar comprovantes ou convidados..."
        }
        value={search}
        onChange={setSearch}
      >
        {activeTab === 'catalogo' && (
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
        )}
      </SearchControl>

      {loading ? (
        <div className={styles.loading}>Carregando dados...</div>
      ) : activeTab === 'catalogo' ? (
        viewType === 'grid' ? (
          // CARD VIEW
          <>
          <div className={styles.gridContainer}>
            {filteredPresentes.slice(0, visibleCatalogo).map(item => {
              const totalLocked = item.presentes_locks?.reduce((acc, lock) => {
                return new Date(lock.expira_em).getTime() > Date.now() ? acc + (lock.quantidade_cotas || 1) : acc;
              }, 0) || 0;
              
              const isFullyLocked = item.permite_cotas 
                ? ((item.cotas_compradas || 0) + totalLocked >= (item.total_cotas || 1))
                : item.presentes_locks?.some(lock => new Date(lock.expira_em).getTime() > Date.now());

              const activeLock = item.presentes_locks?.find(lock => new Date(lock.expira_em).getTime() > Date.now());

              const statusText = isFullyLocked 
                ? '🔒 Sob Reserva' 
                : (item.permite_cotas 
                    ? ((item.cotas_compradas || 0) >= (item.total_cotas || 1) ? 'esgotado' : (item.status === 'reservado' ? 'disponivel' : item.status))
                    : (item.status === 'reservado' && item.quantidade_reservada < item.quantidade_total ? 'Pausado' : item.status)
                  );
              const statusClass = isFullyLocked 
                ? 'reservado' 
                : (item.permite_cotas 
                    ? ((item.cotas_compradas || 0) >= (item.total_cotas || 1) ? 'esgotado' : (item.status === 'reservado' ? 'disponivel' : item.status))
                    : item.status
                  );

              return (
                <motion.div 
                  key={item.id} 
                  className={styles.giftCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={styles.cardImageWrapper}>
                    {/* PRD-015: Badges de Curadoria no Admin (Grid - Topo Esquerdo) */}
                    <div style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', zIndex: 10 }}>
                      {item.highlight_label && (
                        <div style={{ 
                          padding: '6px 12px', 
                          background: 'rgba(255,255,255,0.95)', 
                          borderRadius: '20px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          color: '#C5A059', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(4px)'
                        }}>
                          {(() => {
                            const Icon = {
                              heart: Heart,
                              award: Award,
                              star: Star,
                              gift: Gift,
                              palmtree: Palmtree,
                              glass: GlassWater,
                              party: PartyPopper,
                              coffee: Coffee,
                              plane: Plane,
                              music: Music,
                              smile: Smile,
                              camera: Camera
                            }[item.highlight_icon || 'star'] || Star;
                            return <Icon size={12} strokeWidth={3} />;
                          })()}
                          {item.highlight_label}
                        </div>
                      )}
                      {item.is_sonho_casal && !item.highlight_label && (
                        <div style={{ 
                          padding: '6px 12px', 
                          background: 'rgba(253, 250, 243, 0.95)', 
                          borderRadius: '20px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          color: '#C5A059', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          border: '1px solid #C5A059',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <Heart size={12} strokeWidth={3} />
                          Grande Sonho
                        </div>
                      )}
                    </div>
                    
                    <img src={item.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&auto=format&fit=crop'} alt={item.nome} className={styles.cardImage} />
                    
                    {/* Efeito Hover Overlay Premium unificado */}
                    <div className={styles.hoverOverlay}>
                      <button className={styles.hoverDetailBtn} onClick={() => setDetailItem(item)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Ver Detalhes
                      </button>
                    </div>

                    <span 
                      className={`${styles.cardStatusBadge} ${styles[statusClass]}`}
                      style={activeLock ? { background: '#f97316', color: 'white' } : {}}
                    >
                      {statusText}
                    </span>
                  </div>
                  <div className={styles.cardContent} onClick={() => setDetailItem(item)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 className={styles.cardTitle} style={{ margin: 0 }}>{item.nome}</h3>
                      <span className={styles.miniBadge}>{item.categoria?.nome ?? 'Geral'}</span>
                    </div>
                    <span className={styles.cardPrice}>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    
                    {/* PRD-014 Switch de Cotas Premium Overhauled */}
                    <div className={styles.adminCotaToggleBox} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={(e) => handleInlineQuotaToggle(item.id, !!item.permite_cotas, Number(item.preco), e)}
                        style={{ 
                          width: '34px', 
                          height: '18px', 
                          background: item.permite_cotas ? 'var(--admin-accent, #c5a059)' : '#cbd5e1', 
                          borderRadius: '20px', 
                          position: 'relative', 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          background: '#ffffff', 
                          borderRadius: '50%', 
                          position: 'absolute', 
                          top: '3px', 
                          left: item.permite_cotas ? '19px' : '3px', 
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      {item.permite_cotas ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>{item.total_cotas} Cotas Ativas</span>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{((Number(item.preco)) / (item.total_cotas || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / cota</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Habilitar Cotas</span>
                      )}
                    </div>

                    {/* PRD-014: Barra de Progresso Financeiro Premium integrada */}
                    {item.permite_cotas && (
                      <div style={{ margin: '0 0 1rem 0' }}>
                        <div className={styles.adminProgressBarContainer}>
                          <div 
                            className={styles.adminProgressBarFill}
                            style={{ width: `${Math.min(100, ((item.cotas_compradas || 0) / (item.total_cotas || 1)) * 100)}%` }} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginTop: '-6px' }}>
                          <span>Arrecadado: {Math.round(((item.cotas_compradas || 0) / (item.total_cotas || 1)) * 100)}%</span>
                          <span>{item.cotas_compradas || 0}/{item.total_cotas}</span>
                        </div>
                      </div>
                    )}

                    <div className={styles.cardMeta} style={{ borderTop: item.permite_cotas ? 'none' : '1px solid #f1f5f9', paddingTop: item.permite_cotas ? '0' : '1.5rem' }}>
                      {item.permite_cotas ? (
                        <span className={styles.stockLabel}>Estoque: <strong>{item.total_cotas! - (item.cotas_compradas || 0)} / {item.total_cotas} cotas</strong></span>
                      ) : (
                        <span className={styles.stockLabel}>Estoque: <strong>{item.quantidade_total - item.quantidade_reservada} / {item.quantidade_total}</strong></span>
                      )}
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
                    {activeLock && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#c2410c', background: '#fff7ed', padding: '6px 10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid #ffedd5', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>⏳ Reserva Ativa (3h)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          Por: <strong style={{ color: '#9a3412' }}>{activeLock.convite?.nome_principal || 'Convidado via Link'}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {filteredPresentes.length === 0 && <div className={styles.empty}>Nenhum presente encontrado para a busca.</div>}
          </div>
          {filteredPresentes.length > visibleCatalogo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', paddingBottom: '3rem' }}>
              <button 
                className={styles.addBtn} 
                style={{ background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                onClick={() => setVisibleCatalogo(prev => prev + 10)}
              >
                Carregar Mais 10 Itens
              </button>
            </div>
          )}
          </>
        ) : (
          // LIST VIEW
          <section className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Preço Total</th>
                  <th>Modo de Venda</th>
                  <th>Disponibilidade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPresentes.slice(0, visibleCatalogo).map((item) => {
                  const totalLocked = item.presentes_locks?.reduce((acc, lock) => {
                    return new Date(lock.expira_em).getTime() > Date.now() ? acc + (lock.quantidade_cotas || 1) : acc;
                  }, 0) || 0;
                  
                  const isFullyLocked = item.permite_cotas 
                    ? ((item.cotas_compradas || 0) + totalLocked >= (item.total_cotas || 1))
                    : item.presentes_locks?.some(lock => new Date(lock.expira_em).getTime() > Date.now());

                  const activeLock = item.presentes_locks?.find(lock => new Date(lock.expira_em).getTime() > Date.now());
                  const statusText = isFullyLocked 
                    ? 'sob reserva' 
                    : (item.permite_cotas 
                        ? ((item.cotas_compradas || 0) >= (item.total_cotas || 1) ? 'esgotado' : (item.status === 'reservado' ? 'disponivel' : item.status))
                        : item.status
                      );

                  return (
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div 
                            onClick={(e) => handleInlineQuotaToggle(item.id, !!item.permite_cotas, Number(item.preco), e)}
                            style={{ 
                              width: '34px', 
                              height: '18px', 
                              background: item.permite_cotas ? 'var(--admin-accent, #c5a059)' : '#cbd5e1', 
                              borderRadius: '20px', 
                              position: 'relative', 
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ 
                              width: '12px', 
                              height: '12px', 
                              background: '#ffffff', 
                              borderRadius: '50%', 
                              position: 'absolute', 
                              top: '3px', 
                              left: item.permite_cotas ? '19px' : '3px', 
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                          {item.permite_cotas ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>{item.total_cotas} Cotas</span>
                              <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{((Number(item.preco)) / (item.total_cotas || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / cota</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Integral</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.permite_cotas ? (
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.total_cotas! - (item.cotas_compradas || 0)} / {item.total_cotas} cotas</span>
                        ) : (
                          <span>{item.quantidade_total - item.quantidade_reservada} / {item.quantidade_total} un.</span>
                        )}
                      </td>
                      <td>
                        <span 
                          className={`${styles.statusBadge} ${styles[activeLock ? 'reservado' : item.status]}`}
                          style={activeLock ? { background: '#ffedd5', color: '#ea580c', borderColor: '#fed7aa', fontSize: '0.7rem', fontWeight: 650 } : {}}
                        >
                          {statusText}
                        </span>
                        {activeLock && (
                          <div style={{ fontSize: '0.65rem', color: '#c2410c', marginTop: '4px' }}>
                            👤 {activeLock.convite?.nome_principal || 'Link Externo'}
                          </div>
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} data-tooltip="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button className={styles.successBtn} onClick={(e) => handleToggleStatus(item.id, item.status, e)} data-tooltip="Pausar/Ativar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></button>
                        <button className={styles.deleteBtn} onClick={(e) => openDeleteModal(item.id, 'presente', e)} data-tooltip="Remover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredPresentes.length > visibleCatalogo && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  className={styles.addBtn} 
                  style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                  onClick={() => setVisibleCatalogo(prev => prev + 10)}
                >
                  Ver mais 10 resultados
                </button>
              </div>
            )}
          </section>
        )
      ) : activeTab === 'sugestoes' ? (
        <div>
          {/* Banner Dinâmico de Recomendações do Dia */}
          {recommendedItem && (
            <motion.div 
              className={styles.recomendaBanner}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.recomendaContent}>
                <span className={styles.recomendaBadge}>💡 RECOMENDAÇÕES PARA SUA LISTA</span>
                <h2>{recommendedItem.nome}</h2>
                <p style={{ marginTop: '0.5rem' }}>{recommendedItem.descricao?.substring(0, 100)}...</p>
              </div>
              <div className={styles.recomendaAction}>
                <button 
                  className={styles.recomendaActionBtn}
                  onClick={() => handleImportGift(recommendedItem.origin_id, recommendedItem.type)}
                  disabled={importingId === recommendedItem.origin_id}
                >
                  {importingId === recommendedItem.origin_id ? 'Adicionando...' : 'Adicionar agora'}
                </button>
              </div>
              <div className={styles.recomendaDecorative}>🎁</div>
            </motion.div>
          )}

          {/* Filtro de Categorias via Chips */}
          <div className={styles.categoriesContainer}>
            <button 
              className={`${styles.catBtn} ${selectedCatId === 'todos' ? styles.activeCat : ''}`}
              onClick={() => setSelectedCatId('todos')}
            >
              ✨ Ver Tudo
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`${styles.catBtn} ${selectedCatId === cat.id ? styles.activeCat : ''}`}
                onClick={() => setSelectedCatId(cat.id)}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          {/* Grid de Itens Globais (Vitrine SaaS) */}
          {loadingBase ? (
            <div className={styles.loading}>Buscando catálogo de luxo...</div>
          ) : (
            <>
            <div className={styles.vitrineGrid}>
              {filteredBaseGifts.slice(0, visibleSugestoes).map(baseItem => {
                const isAlreadyCloned = clonedBaseIds.has(baseItem.origin_id) || 
                                       activeGiftNames.has(baseItem.nome?.trim().toLowerCase());
                return (
                  <motion.div 
                    key={baseItem.origin_id}
                    className={styles.giftCard}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className={styles.cardImageWrapper}>
                      <img src={baseItem.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&auto=format&fit=crop'} alt={baseItem.nome} className={styles.cardImage} />
                      
                      {/* Hover overlay unificado com 'Ver Detalhes' na Vitrine SaaS */}
                      <div className={styles.hoverOverlay}>
                        <button className={styles.hoverDetailBtn} onClick={() => setDetailBaseItem(baseItem)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.cardContent}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>{baseItem.nome}</h3>
                        <span className={styles.miniBadge}>{baseItem.categoria_nome || 'Geral'}</span>
                      </div>
                      <span className={styles.cardPrice} style={{ fontSize: '1.1rem' }}>{Number(baseItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      
                      {isAlreadyCloned ? (
                        <div className={styles.importedBadge}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Adicionado à sua lista
                        </div>
                      ) : (
                        <button 
                          className={styles.importBtn} 
                          onClick={() => handleImportGift(baseItem.origin_id, baseItem.type)}
                          disabled={importingId === baseItem.origin_id}
                        >
                          {importingId === baseItem.origin_id ? (
                            <span>Adicionando...</span>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              Adicionar à lista
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {filteredBaseGifts.length > visibleSugestoes && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button className={styles.addBtn} onClick={() => setVisibleSugestoes(prev => prev + 10)}>Carregar mais sugestões</button>
              </div>
            )}
            </>
          )}
        </div>
      ) : (
        // COMPROVANTES (Always List)
        <section className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>Data</th><th>Item</th><th>Convidado</th><th>Comprovante</th><th>Ações</th></tr></thead>
            <tbody>
              {filteredComprovantes.slice(0, visibleRecebidos).map((comp) => (
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
          {filteredComprovantes.length > visibleRecebidos && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <button className={styles.addBtn} onClick={() => setVisibleRecebidos(prev => prev + 10)}>Ver mais comprovantes</button>
            </div>
          )}
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

      {/* Modal: DETAIL PREVIEW (Casal) */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={styles.miniBadge} style={{ background: '#fff3df', color: 'var(--admin-accent)' }}>{detailItem.categoria?.nome ?? 'Geral'}</span>
                    {detailItem.base_id && <span className={styles.miniBadge} style={{ background: '#eff6ff', color: '#2563eb' }}>⭐ Sugestão Curada</span>}
                  </div>
                  <h2>{detailItem.nome}</h2>
                  <div className={styles.detailPrice}>{Number(detailItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  <p className={styles.detailDesc}>{detailItem.descricao || 'Sem descrição registrada para este presente.'}</p>
                  
                  <div className={styles.detailMetaItem}>
                    <span>Disponibilidade</span>
                    {detailItem.permite_cotas ? (
                      <span>{detailItem.total_cotas! - (detailItem.cotas_compradas || 0)} de {detailItem.total_cotas} cotas restantes</span>
                    ) : (
                      <span>{detailItem.quantidade_total - detailItem.quantidade_reservada} de {detailItem.quantidade_total} unidades</span>
                    )}
                  </div>
                  
                  {detailItem.link_externo && (
                    <div className={styles.detailMetaItem}>
                      <span>Link da Loja</span>
                      <a href={detailItem.link_externo} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-accent)', fontWeight: 700 }}>Visitar Loja Externa</a>
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

      {/* Modal: DETAIL PREVIEW DA VITRINE (SaaS) */}
      <AnimatePresence>
        {detailBaseItem && (
          <div className={styles.modalOverlay} onClick={() => setDetailBaseItem(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modal} style={{ maxWidth: '700px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.detailGrid}>
                <img src={detailBaseItem.imagem_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400&fit=crop'} alt="" className={styles.detailImage} />
                <div className={styles.detailText}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className={styles.miniBadge} style={{ background: 'var(--admin-accent)', color: 'white' }}>{detailBaseItem.categoria_nome || 'Geral'}</span>
                  </div>
                  <h2>{detailBaseItem.nome}</h2>
                  <div className={styles.detailPrice}>{Number(detailBaseItem.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  <p className={styles.detailDesc}>{detailBaseItem.descricao || 'Item premium curado com carinho para inspirar a lista do casal.'}</p>
                  
                  {detailBaseItem.link_externo && (
                    <div style={{ marginTop: '1rem' }}>
                      <span className={styles.parceiroTag}>🛒 Sugestão de Parceiro Oficial</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDetailBaseItem(null)}>Fechar</button>
                {(clonedBaseIds.has(detailBaseItem.origin_id) || activeGiftNames.has(detailBaseItem.nome?.trim().toLowerCase())) ? (
                  <div className={styles.importedBadge} style={{ margin: 0 }}>
                     <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     Já Adicionado
                  </div>
                ) : (
                  <button 
                    className={styles.saveBtn} 
                    onClick={() => handleImportGift(detailBaseItem.origin_id, detailBaseItem.type)}
                    disabled={importingId === detailBaseItem.origin_id}
                  >
                    {importingId === detailBaseItem.origin_id ? 'Adicionando...' : '✨ Adicionar à Minha Lista'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: ADD / EDIT FORM */}
      <AnimatePresence>
        {isAdding && (
          <div className={styles.modalOverlay} onClick={discardChanges}>
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalCloseBtn} onClick={discardChanges}>
                <X size={20} />
              </button>
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
                  <input 
                    type="number" 
                    min="1" 
                    disabled={formData.permite_cotas}
                    value={formData.permite_cotas ? 1 : formData.quantidade_total} 
                    onChange={(e) => setFormData({...formData, quantidade_total: parseInt(e.target.value) || 1})} 
                    style={formData.permite_cotas ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className={styles.specialGroupsGrid}>
                  <div className={styles.highlightSection}>
                    <label className={styles.sectionLabel}>Destacar Presente</label>

                    <div className={styles.premiumToggleCard}>
                      <div className={styles.toggleInfo}>
                        <b>Grande Sonho</b>
                        <span>Exibir no topo</span>
                      </div>
                      <label className={styles.switch}>
                        <input 
                          type="checkbox" 
                          checked={formData.is_sonho_casal} 
                          onChange={(e) => setFormData({...formData, is_sonho_casal: e.target.checked})}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                    <div className={styles.customHighlightGroup}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                          Legenda (Opcional)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ex: Escolha da Madrinha..." 
                          maxLength={20}
                          value={formData.highlight_label || ''}
                          onChange={(e) => setFormData({...formData, highlight_label: e.target.value})}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          right: '0', 
                          top: '0', 
                          fontSize: '0.6rem', 
                          color: (formData.highlight_label?.length || 0) >= 20 ? '#e11d48' : '#94a3b8', 
                          fontWeight: 700 
                        }}>
                          {formData.highlight_label?.length || 0}/20
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                          Ícone
                        </label>
                        <div className={styles.iconGrid}>
                          {[
                            { id: 'heart', icon: Heart },
                            { id: 'award', icon: Award },
                            { id: 'star', icon: Star },
                            { id: 'gift', icon: Gift },
                            { id: 'palmtree', icon: Palmtree },
                            { id: 'glass', icon: GlassWater },
                            { id: 'party', icon: PartyPopper },
                            { id: 'coffee', icon: Coffee }
                          ].map(({ id, icon: Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setFormData({...formData, highlight_icon: id})}
                              className={`${styles.iconBtn} ${formData.highlight_icon === id ? styles.iconBtnActive : ''}`}
                            >
                              <Icon size={18} strokeWidth={formData.highlight_icon === id ? 3 : 2} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cotasSection}>
                    <label className={styles.sectionLabel}>Cotas Coletivas</label>
                    
                    <div className={styles.cotaCard}>
                      <div className={styles.cotaInfo}>
                        <b>Dividir em Cotas 🤝</b>
                        <span>Múltiplos convidados</span>
                      </div>
                      <label className={styles.switch}>
                        <input 
                          type="checkbox" 
                          checked={formData.permite_cotas} 
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData, 
                              permite_cotas: checked,
                              quantidade_total: checked ? 1 : formData.quantidade_total,
                              total_cotas: checked ? 2 : formData.total_cotas
                            });
                          }}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                    {formData.permite_cotas && (
                      <div className={styles.cotaDetails}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nº de Divisões</label>
                          <input 
                            type="number" 
                            min="2" 
                            max="200"
                            value={formData.total_cotas} 
                            onChange={(e) => setFormData({...formData, total_cotas: parseInt(e.target.value) || 2})}
                          />
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>VALOR POR COTA</div>
                          <div style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: 800, 
                            color: (Number(formData.preco) / (Number(formData.total_cotas) || 1)) < 50 ? '#e11d48' : '#059669' 
                          }}>
                            {(Number(formData.preco) / (Number(formData.total_cotas) || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label>Categoria do Presente</label>
                  <select value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}>
                    <option value="">Sem categoria definida (Geral)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
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
