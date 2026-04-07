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
  const [newItem, setNewItem] = useState({ 
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
    setTimeout(() => {
      fetchPresentes();
    }, 0);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Garantimos que os dados estão limpos e no formato correto
    const payload = {
      nome: newItem.nome.trim(),
      preco: Number(newItem.preco),
      descricao: newItem.descricao.trim(),
      imagem_url: newItem.imagem_url,
      status: newItem.status,
      quantidade_total: Number(newItem.quantidade_total)
    };

    const { data, error } = await supabase
      .from('presentes')
      .insert([payload])
      .select();

    if (!error && data) {
      setPresentes(prev => [data[0] as Presente, ...prev]);
      setIsAdding(false);
      setNewItem({ nome: '', preco: 0, descricao: '', imagem_url: '', status: 'disponivel', quantidade_total: 1 });
    } else {
      console.error('Erro detalhado Supabase (Add):', error);
      alert(`Erro ao adicionar item: ${error?.message || 'Erro desconhecido'}`);
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
          <form className={styles.modal} onSubmit={handleAdd}>
            <h2>Adicionar Novo Presente</h2>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemName">Nome do Item:</label>
              <input 
                id="itemName"
                type="text" 
                required 
                value={newItem.nome}
                onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemPrice">Preço (R$):</label>
              <input 
                id="itemPrice"
                type="number" 
                required 
                value={newItem.preco || ''}
                onChange={(e) => setNewItem({...newItem, preco: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemQty">Quantidade Total:</label>
              <input 
                id="itemQty"
                type="number" 
                min="1"
                required 
                value={newItem.quantidade_total}
                onChange={(e) => setNewItem({...newItem, quantidade_total: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="itemDesc">Descrição:</label>
              <textarea 
                id="itemDesc"
                value={newItem.descricao}
                onChange={(e) => setNewItem({...newItem, descricao: e.target.value})}
              />
            </div>
            
            <div className={styles.fieldGroup}>
              <label>Foto do Presente:</label>
              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                <CldUploadWidget 
                  uploadPreset="invite_preset"
                  signatureEndpoint={undefined} // Garante modo não assinado
                  onSuccess={(result: any) => {
                    const url = result?.info?.secure_url;
                    if (url) {
                      setNewItem(prev => ({...prev, imagem_url: url}));
                      console.log('URL da Imagem salva:', url);
                    }
                  }}
                >
                  {({ open }) => (
                    <button type="button" className={styles.uploadBtn} onClick={() => open()}>
                      {newItem.imagem_url ? 'Foto Carregada ✅' : 'Subir Foto'}
                    </button>
                  )}
                </CldUploadWidget>
              ) : (
                <p className={styles.error}>⚠️ Configure o Cloudinary no .env para habilitar upload.</p>
              )}
              {newItem.imagem_url && <p className={styles.urlLabel}>URL detectada: {newItem.imagem_url.substring(0, 40)}...</p>}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn}>Salvar Presente</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsAdding(false)}>Cancelar</button>
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
                  <td>
                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button onClick={() => handleToggleStatus(item.id, item.status)}>
                      Alternar Status
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
