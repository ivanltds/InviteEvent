'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CldUploadWidget } from 'next-cloudinary';
import styles from './Mural.module.css';
import { muralService } from '@/lib/services/muralService';
import { MuralItem, Configuracao } from '@/lib/types/database';

interface MuralSectionProps {
  eventoId: string;
  config?: Configuracao;
}

export default function MuralSection({ eventoId, config }: MuralSectionProps) {
  const [items, setItems] = useState<MuralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'MENSAGEM' | 'MIDIA'>('MENSAGEM');
  
  const [uploads, setUploads] = useState<{url: string, type: string}[]>([]);
  const [formData, setFormData] = useState({ nome: '', mensagem: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await muralService.getApprovedItems(eventoId);
        // Embaralhar magicamente a ordem
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setItems(shuffled);
      } catch (e) {
        console.error('Erro ao carregar mural:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventoId]);

  const handleUploadSuccess = (result: any) => {
    const url = result?.info?.secure_url;
    const resourceType = result?.info?.resource_type;
    if (url) {
      setUploads(prev => [...prev, { url, type: resourceType === 'video' ? 'VIDEO' : 'FOTO' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let allSuccess = true;

    if (uploads.length === 0) {
       // Submit text only
       const payload: Partial<MuralItem> = {
         evento_id: eventoId,
         autor: formData.nome,
         mensagem: formData.mensagem,
         tipo: 'MENSAGEM'
       };
       const { success } = await muralService.submitItem(payload);
       if (!success) allSuccess = false;
    } else {
       // Submit for each uploaded media
       for (const media of uploads) {
          let tipo: 'FOTO' | 'MENSAGEM' | 'HIBRIDO' | 'VIDEO' = media.type as 'FOTO'|'VIDEO';
          if (tipo === 'FOTO' && formData.mensagem.trim() !== '') tipo = 'HIBRIDO';
          if (tipo === 'VIDEO' && formData.mensagem.trim() !== '') tipo = 'HIBRIDO';

          const payload: Partial<MuralItem> = {
            evento_id: eventoId,
            autor: formData.nome,
            mensagem: formData.mensagem, // a mesma mensagem para todas as fotos enviadas juntas
            url_midia: media.url,
            tipo
          };
          const { success } = await muralService.submitItem(payload);
          if (!success) allSuccess = false;
       }
    }

    if (allSuccess) {
      setSubmitted(true);
      setFormData({ nome: '', mensagem: '' });
      setUploads([]);
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 3000);
    }
    setIsSubmitting(false);
  };

  // Dinamic grid spans for masonry
  const getGridSpan = (tipo: string, length: number) => {
    if (tipo === 'FOTO' || tipo === 'VIDEO') return styles.span3;
    if (tipo === 'HIBRIDO') return styles.span3;
    if (length > 150) return styles.span3;
    return styles.span2;
  };

  return (
    <section className={styles.section} id="mural">
      <div className={styles.container}>
        <motion.h2 
          className="cursive"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ color: config?.accent_color }}
        >
          Mural Vivo de Lembranças
        </motion.h2>
        <p className={styles.subtitle}>Eternize momentos. Compartilhe fotos, vídeos e mensagens com os noivos.</p>

        <div className={styles.actionRow}>
          <button 
            className={styles.addBtn} 
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: config?.accent_color }}
          >
            📸 Compartilhar Lembrança
          </button>
        </div>

        <div className={styles.masonryGrid}>
          {loading ? (
            <p>Preparando mural mágico...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>Seja o primeiro a compartilhar uma lembrança!</p>
          ) : (
            items.map((item, index) => (
              <motion.div 
                key={item.id}
                className={`${styles.muralCard} ${getGridSpan(item.tipo, item.mensagem?.length || 0)}`}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ delay: (index % 6) * 0.1, duration: 0.6 }}
              >
                {item.tipo === 'MENSAGEM' && (
                  <div className={styles.textOnlyCard}>
                    <p className={styles.text}>"{item.mensagem}"</p>
                    <span className={styles.textAuthor}>— {item.autor || 'Anônimo'}</span>
                  </div>
                )}

                {item.tipo === 'HIBRIDO' && item.url_midia && (
                  <div className={styles.overlayMediaWrapper}>
                    <img src={item.url_midia} alt="Lembrança" loading="lazy" />
                    <div className={styles.overlayContent}>
                      <p className={styles.overlayText}>"{item.mensagem}"</p>
                      <span className={styles.overlayAuthor}>— {item.autor || 'Anônimo'}</span>
                    </div>
                  </div>
                )}

                {item.tipo === 'FOTO' && item.url_midia && (
                  <>
                    <div className={styles.mediaWrapper}>
                      <img src={item.url_midia} alt="Lembrança" loading="lazy" />
                    </div>
                    {item.mensagem && (
                      <p className={styles.hybridText}>"{item.mensagem}"</p>
                    )}
                    <div className={styles.footer}>
                      <span className={styles.author}>{item.autor || 'Anônimo'}</span>
                    </div>
                  </>
                )}

                {item.tipo === 'VIDEO' && item.url_midia && (
                  <>
                    <div className={styles.mediaWrapper}>
                      <video src={item.url_midia} muted loop autoPlay playsInline />
                    </div>
                    {item.mensagem && (
                      <p className={styles.hybridText}>"{item.mensagem}"</p>
                    )}
                    <div className={styles.footer}>
                      <span className={styles.author}>{item.autor || 'Anônimo'}</span>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modal}
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
            >
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>&times;</button>
              
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <h3 className="cursive" style={{ color: config?.accent_color }}>Eternizar Momento</h3>
                  
                  <div className={styles.toggleGroup}>
                    <button 
                      type="button" 
                      className={`${styles.toggleBtn} ${formType === 'MENSAGEM' ? styles.toggleActive : ''}`}
                      onClick={() => { setFormType('MENSAGEM'); setUploads([]); }}
                      style={formType === 'MENSAGEM' ? { backgroundColor: config?.accent_color || '#C5A059' } : {}}
                    >
                      ✍️ Apenas Recado
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.toggleBtn} ${formType === 'MIDIA' ? styles.toggleActive : ''}`}
                      onClick={() => setFormType('MIDIA')}
                      style={formType === 'MIDIA' ? { backgroundColor: config?.accent_color || '#C5A059' } : {}}
                    >
                      📸 Foto ou Vídeo
                    </button>
                  </div>
                  
                  {formType === 'MIDIA' && (
                    !uploads.length ? (
                      <CldUploadWidget 
                        uploadPreset="invite_preset" 
                        onSuccess={handleUploadSuccess}
                        options={{
                          maxFiles: 10,
                          clientAllowedFormats: ['jpg', 'png', 'webp', 'jpeg', 'mp4', 'mov', 'webm'],
                          maxFileSize: 15000000,
                        }}
                      >
                        {({ open }) => (
                          <div className={styles.uploadArea} onClick={() => open()}>
                            <p>📷 Clique para adicionar Fotos ou Vídeos</p>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>(Até 10 arquivos por vez)</span>
                          </div>
                        )}
                      </CldUploadWidget>
                    ) : (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {uploads.map((up, i) => (
                            <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                              {up.type === 'FOTO' ? (
                                <img src={up.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                              ) : (
                                <video src={up.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} muted />
                              )}
                              <button 
                                type="button" 
                                onClick={() => setUploads(uploads.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '10px' }}
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {uploads.length < 10 && (
                          <CldUploadWidget 
                            uploadPreset="invite_preset" 
                            onSuccess={handleUploadSuccess}
                            options={{ maxFiles: 10 - uploads.length }}
                          >
                            {({ open }) => (
                              <button type="button" onClick={() => open()} style={{ background: 'transparent', border: `1px solid ${config?.accent_color}`, color: config?.accent_color, padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                                + Adicionar Mais
                              </button>
                            )}
                          </CldUploadWidget>
                        )}
                      </div>
                    )
                  )}

                  <div className={styles.field}>
                    <label>Sua Mensagem / Legenda</label>
                    <textarea 
                      value={formData.mensagem} 
                      onChange={e => setFormData({...formData, mensagem: e.target.value})} 
                      required={formType === 'MENSAGEM' || uploads.length === 0} 
                      rows={3}
                      placeholder={formType === 'MENSAGEM' ? "Escreva sua mensagem aqui..." : "Adicione uma legenda para todas as mídias (opcional)"}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Seu Nome</label>
                    <input 
                      value={formData.nome} 
                      onChange={e => setFormData({...formData, nome: e.target.value})} 
                      required 
                      placeholder="Como quer ser identificado?"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className={styles.submitBtn} 
                    disabled={isSubmitting}
                    style={{ backgroundColor: config?.accent_color }}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Lembrança'}
                  </button>
                </form>
              ) : (
                <div className={styles.success}>
                  <div className={styles.successIcon}>✨</div>
                  <h3>Momento eternizado!</h3>
                  <p>Sua lembrança foi enviada com sucesso e será exibida no mural após a aprovação dos noivos.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
