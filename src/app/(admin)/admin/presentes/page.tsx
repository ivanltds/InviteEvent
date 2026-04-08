'use client';

import { useState, useEffect } from 'react';
import styles from './AdminPresentes.module.css';
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';

interface Presente {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  imagem_url: string;
  status: 'disponivel' | 'reservado' | 'pausado';
  quantidade_total: number;
  quantidade_reservada: number;
}

export default function AdminPresentes() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Presente | null>(null);
  const [formData, setFormData] = useState({ 
    nome: '', 
    preco: 0, 
    descricao: '', 
    imagem_url: '', 
    status: 'disponivel' as const,
    quantidade_total: 1 
  });

  const fetchPresentes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('presentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setPresentes(data as Presente[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPresentes();
  }, []);

  const resetForm = () => {
    setFormData({ nome: '', preco: 0, descricao: '', imagem_url: '', status: 'disponivel', quantidade_total: 1 });
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
      quantidade_total: item.quantidade_total
    });
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      nome: formData.nome.trim(),
      preco: Number(formData.preco),
      descricao: formData.descricao.trim(),
      imagem_url: formData.imagem_url,
      status: formData.status,
      quantidade_total: Number(formData.quantidade_total)
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
    const nextStatus = currentStatus === 'disponivel' ? 'reservado' : 'disponivel';
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

  return (
    <main className={styles.adminMain}>
      <header className={styles.adminHeader}>
        <h1>Gestão de Presentes</h1>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>Novo Item</button>
      </header>

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
          <p className={styles.loading}>Carregando presentes...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Preço</th>
                <th>Qtd Total</th>
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
                  <td>{item.quantidade_total}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                      {item.status}
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
                  <td colSpan={4} className={styles.empty}>Nenhum presente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
