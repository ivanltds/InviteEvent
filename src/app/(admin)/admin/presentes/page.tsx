'use client';

import { useState, useEffect } from 'react';
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
  presente: { nome: string };
  convite: { nome_principal: string };
}

export default function AdminPresentes() {
  const { currentEvent, loading: eventLoading } = useEvent();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'recebidos'>('catalogo');
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [comprovantes, setComprovantes] = useState<ComprovanteJoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Presente | null>(null);
  const [formData, setFormData] = useState({ 
    nome: '', 
    preco: 0, 
    descricao: '', 
    imagem_url: '', 
    status: 'disponivel' as Presente['status'],
    quantidade_total: 1,
    link_externo: '' 
  });

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
      .select('*, presente:presentes!inner(nome, evento_id), convite:convites(nome_principal)')
      .eq('presente.evento_id', currentEvent.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setComprovantes(data as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'catalogo') {
      fetchPresentes();
    } else {
      fetchComprovantes();
    }
  }, [activeTab, currentEvent]);

  const resetForm = () => {
    setFormData({ nome: '', preco: 0, descricao: '', imagem_url: '', status: 'disponivel', quantidade_total: 1, link_externo: '' });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleEditClick = (item: Presente) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      preco: item.preco,
      descricao: item.descricao || '',
      imagem_url: item.imagem_url || '',
      status: item.status,
      quantidade_total: item.quantidade_total,
      link_externo: item.link_externo || ''
    });
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    setLoading(true);
    
    const qtyTotal = Number(formData.quantidade_total);
    const qtyReservada = editingItem ? editingItem.quantidade_reservada : 0;
    
    // Recalcular status baseado no estoque, a menos que esteja pausado
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
      // Update
      const { data, error } = await supabase
        .from('presentes')
        .update(payload)
        .eq('id', editingItem.id)
        .select();

      if (!error && data) {
        setPresentes(presentes.map(p => p.id === editingItem.id ? (data[0] as Presente) : p));
        resetForm();
      } else {
        alert(`Erro ao atualizar: ${error?.message}`);
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('presentes')
        .insert([payload])
        .select();

      if (!error && data) {
        setPresentes(prev => [data[0] as Presente, ...prev]);
        resetForm();
      } else {
        alert(`Erro ao adicionar: ${error?.message}`);
      }
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'disponivel' ? 'pausado' : 'disponivel';
    const { error } = await supabase
      .from('presentes')
      .update({ status: nextStatus })
      .eq('id', id);

    if (!error) {
      setPresentes(presentes.map(p => p.id === id ? { ...p, status: nextStatus as Presente['status'] } : p));
    } else {
      console.error('Erro Supabase (Toggle):', error);
      alert(`Erro ao alterar status: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      const { error } = await supabase
        .from('presentes')
        .delete()
        .eq('id', id);

      if (!error) {
        setPresentes(presentes.filter(p => p.id !== id));
      } else {
        console.error('Erro Supabase (Delete):', error);
        alert(`Erro ao remover item: ${error.message}`);
      }
    }
  };

  const handleDeleteComprovante = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este comprovante?')) {
      const { error } = await supabase
        .from('comprovantes')
        .delete()
        .eq('id', id);

      if (!error) {
        setComprovantes(comprovantes.filter(c => c.id !== id));
      } else {
        alert(`Erro ao remover comprovante: ${error.message}`);
      }
    }
  };

  if (eventLoading) return <div className={styles.loading}>Carregando...</div>;

  if (!currentEvent) {
    return (
      <main className={styles.adminMain}>
        <h1>Presentes</h1>
        <p>Selecione um evento para gerenciar os presentes.</p>
      </main>
    );
  }

  return (
    <main className={styles.adminMain}>
      <header className={styles.adminHeader}>
        <h1>Gestão de Presentes: {currentEvent.nome}</h1>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>Novo Item</button>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'catalogo' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('catalogo')}
        >
          Catálogo
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'recebidos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('recebidos')}
        >
          Recebidos
        </button>
      </div>

      {isAdding && (
        <section className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <h2>{editingItem ? 'Editar Presente' : 'Adicionar Novo Presente'}</h2>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemName">Nome do Item:</label>
              <input 
                id="itemName"
                type="text" 
                required 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemPrice">Preço (R$):</label>
              <input 
                id="itemPrice"
                type="number" 
                required 
                value={formData.preco || ''}
                onChange={(e) => setFormData({...formData, preco: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemQty">Quantidade Total:</label>
              <input 
                id="itemQty"
                type="number" 
                min="1"
                required 
                value={formData.quantidade_total}
                onChange={(e) => setFormData({...formData, quantidade_total: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemDesc">Descrição:</label>
              <textarea 
                id="itemDesc"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="itemLink">Link da Loja (Opcional):</label>
              <input 
                id="itemLink"
                type="url" 
                placeholder="https://loja.com/produto"
                value={formData.link_externo}
                onChange={(e) => setFormData({...formData, link_externo: e.target.value})}
              />
              <p className={styles.helpText}>Se preenchido, o convidado poderá ver o produto original e decidir comprar por lá.</p>
            </div>
            
            <div className={styles.fieldGroup}>
              <label>Foto do Presente:</label>
              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                <CldUploadWidget 
                  uploadPreset="invite_preset"
                  onSuccess={(result: any) => {
                    const url = result?.info?.secure_url;
                    if (url) {
                      setFormData(prev => ({...prev, imagem_url: url}));
                    }
                  }}
                >
                  {({ open }) => (
                    <button type="button" className={styles.uploadBtn} onClick={() => open()}>
                      {formData.imagem_url ? 'Alterar Foto' : 'Subir Foto'}
                    </button>
                  )}
                </CldUploadWidget>
              ) : (
                <p className={styles.error}>Configure o Cloudinary para habilitar upload.</p>
              )}
              {formData.imagem_url && <p className={styles.urlLabel}>Foto selecionada.</p>}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn}>
                {editingItem ? 'Salvar Alterações' : 'Criar Presente'}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.tableContainer}>
        {loading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : activeTab === 'catalogo' ? (
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
                <tr key={item.id}>
                  <td>
                    <div className={styles.itemCell}>
                      {item.imagem_url && <img src={item.imagem_url} alt="" className={styles.miniThumb} />}
                      <span>{item.nome}</span>
                    </div>
                  </td>
                  <td>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{item.quantidade_total - item.quantidade_reservada} / {item.quantidade_total}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                      {item.status === 'reservado' && item.quantidade_reservada < item.quantidade_total ? 'Pausado' : item.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button onClick={() => handleEditClick(item)}>
                      Editar
                    </button>
                    <button onClick={() => handleToggleStatus(item.id, item.status)}>
                      Pausar/Ativar
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Remover</button>
                  </td>
                </tr>
              ))}
              {presentes.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>Nenhum presente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Presente</th>
                <th>Convidado</th>
                <th>Comprovante</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprovantes.map((comp) => (
                <tr key={comp.id}>
                  <td>{new Date(comp.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>{comp.presente?.nome || 'Item removido'}</td>
                  <td>
                    <div className={styles.guestInfo}>
                      <strong>{comp.convidado_nome}</strong>
                      {comp.convite && <span className={styles.inviteTag}>Convite: {comp.convite.nome_principal}</span>}
                    </div>
                  </td>
                  <td>
                    <a href={comp.url_comprovante} target="_blank" rel="noopener noreferrer">
                      <img src={comp.url_comprovante} alt="Comprovante" className={styles.comprovanteThumb} title="Clique para ampliar" />
                    </a>
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteComprovante(comp.id)}>Remover</button>
                  </td>
                </tr>
              ))}
              {comprovantes.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>Nenhum comprovante recebido ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
