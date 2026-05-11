'use client';

/**
 * STORY-055: force-dynamic previne prerendering estático em build.
 * Esta página usa hooks (useState/useEffect) e contexto Supabase que
 * não funcionam durante SSG — exige renderização dinâmica no servidor.
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import styles from './AdminConfig.module.css';
import { configService } from '@/lib/services/configService';
import { Configuracao } from '@/lib/types/database';
import FAQManager from '@/components/admin/FAQManager';
import ConfigPreview from '@/components/admin/ConfigPreview';
import TeamManagement from '@/components/admin/TeamManagement';
import FontPicker from '@/components/admin/FontPicker/FontPicker';
import HeroImagesManager from '@/components/admin/HeroImagesManager';
import { useEvent } from '@/lib/contexts/EventContext';
import { supabase } from '@/lib/supabase';

const DEFAULT_CONFIG: Omit<Configuracao, 'id' | 'evento_id'> = {
  noiva_nome: 'Noiva',
  noivo_nome: 'Noivo',
  data_casamento: '2026-06-13',
  prazo_rsvp: '2026-05-13',
  horario_cerimonia: '16:00',
  horario_recepcao: '18:30',
  local_cerimonia: 'Igreja Matriz',
  endereco_cerimonia: 'Praça da Matriz, Centro',
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
  pix_chave: '',
  pix_banco: '',
  pix_nome: '',
  pix_tipo: 'cpf',
  historia_titulo: 'Nossa História',
  historia_subtitulo: 'O Início de Tudo',
  historia_texto: 'Tudo começou através de um amigo distante do primo da noiva...',
  historia_conclusao: 'O dia 13 de junho não é apenas uma data qualquer. Foi o dia em que o pedido de namoro aconteceu, e agora, será o dia em que diremos "sim" para o resto de nossas vidas.',
  noiva_bio: 'Bio da Noiva...',
  noivo_bio: 'Bio do Noivo...',
  noivos_conclusao: 'Mensagem Final do Casal...',
  bg_primary: '#fdfbf7',
  text_main: '#4a4a4a',
  accent_color: '#8fa89b',
  font_cursive: "'Pinyon Script', cursive",
  font_serif: "'Playfair Display', serif"
};

export default function AdminConfig() {
  const router = useRouter();
  const { currentEvent, loading: eventLoading } = useEvent();
  
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [originalConfigStr, setOriginalConfigStr] = useState<string>('');
  const [agenda, setAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Novos estados para UX/Controle
  const [showToast, setShowToast] = useState(false);
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const bypassGuardRef = useRef(false);

  // Verifica sujeira
  const isDirty = config && originalConfigStr && JSON.stringify(config) !== originalConfigStr;

  const fetchConfig = async () => {
    if (!currentEvent) return;
    
    setLoading(true);
    try {
      const [data, agendaRes] = await Promise.all([
        configService.getConfig(currentEvent.id),
        supabase
          .from('eventos_agenda')
          .select('*')
          .eq('evento_id', currentEvent.id)
          .order('ordem', { ascending: true })
      ]);
      
      if (agendaRes.data) setAgenda(agendaRes.data);

      if (data) {
        setConfig(data);
        setOriginalConfigStr(JSON.stringify(data));
      } else {
        const newPayload = { 
          ...DEFAULT_CONFIG, 
          evento_id: currentEvent.id,
          noiva_nome: 'Noiva',
          noivo_nome: 'Noivo'
        };
        
        const { success } = await configService.updateConfig(currentEvent.id, newPayload);
        if (success) {
          const newData = await configService.getConfig(currentEvent.id);
          if (newData) {
            setConfig(newData);
            setOriginalConfigStr(JSON.stringify(newData));
          }
        }
      }
    } catch (err: any) {
      console.error('[Config] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Suporte a Âncoras (ex: #equipe) ao carregar e ao mudar Hash
  useEffect(() => {
    if (!loading && typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300); // Timeout garante render completo dos sub-componentes
    }
  }, [loading]);

  useEffect(() => {
    const handleHash = () => {
      const id = window.location.hash.replace('#', '');
      if (id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Interceptador de navegação interna (Links/Sidebar)
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      // Se clicou em um link que não é uma hash tag e não é nova aba
      if (target && target.href && !target.href.includes('#') && !target.target) {
        // Interrompe a navegação do Next.js preventivamente
        e.preventDefault();
        e.stopPropagation();
        setPendingNavUrl(target.href);
      }
    };

    // Bloqueio de fechamento da aba do navegador
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassGuardRef.current) return;
      e.preventDefault();
      return (e.returnValue = 'Você tem alterações não salvas. Deseja mesmo sair?');
    };

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (currentEvent) {
      fetchConfig();
    } else if (!eventLoading) {
      setLoading(false);
    }
  }, [currentEvent, eventLoading]);

  const handleSave = async (e?: React.FormEvent, navigateAfter = false) => {
    if (e) e.preventDefault();
    if (!config || !currentEvent) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, ...updateData } = config;
      const { success, error } = await configService.updateConfig(currentEvent.id, updateData);

      if (success) {
        setOriginalConfigStr(JSON.stringify(config)); // Limpa dirty state
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        if (navigateAfter && pendingNavUrl) {
          bypassGuardRef.current = true;
          window.location.href = pendingNavUrl; // Força o redirecionamento limpo
        }
      } else {
        console.error('Erro ao salvar:', error);
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAndLeave = () => {
    if (pendingNavUrl) {
      bypassGuardRef.current = true;
      window.location.href = pendingNavUrl; // Abandona sem salvar
    }
  };

  if (eventLoading || (loading && currentEvent)) return <div className={styles.loading}>Carregando configurações...</div>;

  if (!currentEvent) {
    return (
      <main className={styles.container}>
        <h1>Configurações</h1>
        <p>Selecione um evento para gerenciar as configurações.</p>
      </main>
    );
  }

  if (!config) {
    return (
      <main className={styles.container}>
        <h1>Configurações</h1>
        <p>Erro ao carregar as configurações do evento. Por favor, tente novamente.</p>
        <button onClick={fetchConfig} className={styles.saveBtn}>Tentar Novamente</button>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações do Evento: {currentEvent.nome}</h1>
        <p>Ajuste a identidade visual e as informações do seu grande dia.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <form onSubmit={handleSave} className={styles.form}>
            <section className={styles.section}>
              <h2>Identidade Visual & Cores</h2>
              
              <HeroImagesManager 
                images={config.hero_images || []}
                videos={config.hero_videos || []}
                onImagesChange={(newImages) => setConfig({ ...config, hero_images: newImages })}
                onVideosChange={(newVideos) => setConfig({ ...config, hero_videos: newVideos })}
                accentColor={config.accent_color}
              />

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="bg_primary">Cor de Fundo (Páginas)</label>
                  <div className={styles.colorPickerGroup}>
                    <input
                      id="bg_primary"
                      type="color"
                      value={config.bg_primary || '#fdfbf7'}
                      onChange={(e) => setConfig({...config, bg_primary: e.target.value})}
                    />
                    <span>{config.bg_primary || '#fdfbf7'}</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="text_main">Cor do Texto Principal</label>
                  <div className={styles.colorPickerGroup}>
                    <input
                      id="text_main"
                      type="color"
                      value={config.text_main || '#4a4a4a'}
                      onChange={(e) => setConfig({...config, text_main: e.target.value})}
                    />
                    <span>{config.text_main || '#4a4a4a'}</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="accent_color">Cor de Destaque (Botões/Títulos)</label>
                  <div className={styles.colorPickerGroup}>
                    <input
                      id="accent_color"
                      type="color"
                      value={config.accent_color || '#8fa89b'}
                      onChange={(e) => setConfig({...config, accent_color: e.target.value})}
                    />
                    <span>{config.accent_color || '#8fa89b'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <h2>Tipografia Premium</h2>
                <FontPicker
                  currentCursive={config.font_cursive || "'Pinyon Script', cursive"}
                  currentSerif={config.font_serif || "'Playfair Display', serif"}
                  coupleNames={`${config.noiva_nome} & ${config.noivo_nome}`}
                  onCursiveChange={(css) => setConfig({ ...config, font_cursive: css })}
                  onSerifChange={(css) => setConfig({ ...config, font_serif: css })}
                />
              </div>

            </section>

            <section className={styles.section}>
              <h2>Animação de Entrada</h2>
              <p className={styles.helpText}>Escolha o efeito cinematográfico que os convidados verão ao abrir seu convite.</p>
              <div className={styles.animationSelectorGrid}>
                {[
                  { id: 'padrao', label: 'Tradicional', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> },
                  { id: 'envelope_v3', label: '3D Envelope', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline></svg> },
                  { id: 'cinematic', label: 'Cinematic Spark', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> },
                  { id: 'flower_wind', label: 'Pétalas ao Vento', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg> },
                  { id: 'flower_wind_2', label: 'Pétalas ao Vento 2', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5-.1 9.2A7 7 0 0 1 11 20z"></path><path d="M11 20v-5.5"></path></svg> },
                ].map(opt => {
                  const isActive = (config.animacao_tipo || 'padrao') === opt.id;
                  return (
                    <div 
                      key={opt.id} 
                      className={`${styles.animationOption} ${isActive ? styles.animationOptionActive : ''}`}
                      onClick={() => setConfig({ ...config, animacao_tipo: opt.id as any })}
                    >
                      <div className={styles.animIcon}>{opt.icon}</div>
                      <div className={styles.animLabel}>{opt.label}</div>
                      {isActive && <div className={styles.activeBadge}>✓</div>}
                    </div>
                  );
                })}
              </div>
            </section>
            
            <section className={styles.section}>
              <h2>Módulos do Convite (Visibilidade)</h2>
              <p className={styles.helpText}>Escolha quais seções deseja exibir para seus convidados.</p>
              <div className={styles.checkboxGrid}>
                <div className={styles.checkboxField}>
                  <input
                    id="mostrar_historia"
                    type="checkbox"
                    checked={config.mostrar_historia !== false}
                    onChange={(e) => setConfig({...config, mostrar_historia: e.target.checked})}
                  />
                  <label htmlFor="mostrar_historia">Nossa História</label>
                </div>
                <div className={styles.checkboxField}>
                  <input
                    id="mostrar_noivos"
                    type="checkbox"
                    checked={config.mostrar_noivos !== false}
                    onChange={(e) => setConfig({...config, mostrar_noivos: e.target.checked})}
                  />
                  <label htmlFor="mostrar_noivos">Os Noivos (Bio)</label>
                </div>
                <div className={styles.checkboxField}>
                  <input
                    id="mostrar_faq"
                    type="checkbox"
                    checked={config.mostrar_faq !== false}
                    onChange={(e) => setConfig({...config, mostrar_faq: e.target.checked})}
                  />
                  <label htmlFor="mostrar_faq">FAQ (Perguntas Frequentes)</label>
                </div>
                <div className={styles.checkboxField}>
                  <input
                    id="mostrar_presentes"
                    type="checkbox"
                    checked={config.mostrar_presentes !== false}
                    onChange={(e) => setConfig({...config, mostrar_presentes: e.target.checked})}
                  />
                  <label htmlFor="mostrar_presentes">Lista de Presentes (PIX)</label>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Os Noivos</h2>
              <div className={styles.grid}>
                <div className={styles.fieldFull}>
                  <div className={styles.couplePhotosGrid}>
                    <div className={styles.photoUploadField}>
                      <label>Foto da Noiva</label>
                      <div className={styles.photoPreviewWrapper}>
                        {config.noiva_foto_url ? (
                          <img src={config.noiva_foto_url} alt="Noiva" className={styles.couplePreview} />
                        ) : (
                          <div className={styles.photoPlaceholder}><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                        )}
                        <CldUploadWidget uploadPreset="invite_preset" onSuccess={(res: any) => setConfig({...config, noiva_foto_url: res.info.secure_url})}>
                          {({ open }) => (
                            <button type="button" onClick={() => open()} className={styles.miniUploadBtn}>Trocar Foto</button>
                          )}
                        </CldUploadWidget>
                      </div>
                    </div>

                    <div className={styles.photoUploadField}>
                      <label>Foto do Noivo</label>
                      <div className={styles.photoPreviewWrapper}>
                        {config.noivo_foto_url ? (
                          <img src={config.noivo_foto_url} alt="Noivo" className={styles.couplePreview} />
                        ) : (
                          <div className={styles.photoPlaceholder}><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                        )}
                        <CldUploadWidget uploadPreset="invite_preset" onSuccess={(res: any) => setConfig({...config, noivo_foto_url: res.info.secure_url})}>
                          {({ open }) => (
                            <button type="button" onClick={() => open()} className={styles.miniUploadBtn}>Trocar Foto</button>
                          )}
                        </CldUploadWidget>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="noiva_nome">Nome da Noiva</label>
                  <input
                    id="noiva_nome"
                    type="text"
                    value={config.noiva_nome}
                    onChange={(e) => setConfig({...config, noiva_nome: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="noivo_nome">Nome do Noivo</label>
                  <input
                    id="noivo_nome"
                    type="text"
                    value={config.noivo_nome}
                    onChange={(e) => setConfig({...config, noivo_nome: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="noiva_bio">Bio da Noiva</label>
                  <textarea
                    id="noiva_bio"
                    value={config.noiva_bio}
                    onChange={(e) => setConfig({...config, noiva_bio: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="noivo_bio">Bio do Noivo</label>
                  <textarea
                    id="noivo_bio"
                    value={config.noivo_bio}
                    onChange={(e) => setConfig({...config, noivo_bio: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="noivos_conclusao">Mensagem Final do Casal</label>
                  <textarea
                    id="noivos_conclusao"
                    value={config.noivos_conclusao}
                    onChange={(e) => setConfig({...config, noivos_conclusao: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Nossa História</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="historia_titulo">Título</label>
                  <input
                    id="historia_titulo"
                    type="text"
                    value={config.historia_titulo}
                    onChange={(e) => setConfig({...config, historia_titulo: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="historia_subtitulo">Subtítulo</label>
                  <input
                    id="historia_subtitulo"
                    type="text"
                    value={config.historia_subtitulo}
                    onChange={(e) => setConfig({...config, historia_subtitulo: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="historia_texto">O Texto da História</label>
                  <textarea
                    id="historia_texto"
                    className={styles.tallTextarea}
                    value={config.historia_texto}
                    onChange={(e) => setConfig({...config, historia_texto: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="historia_conclusao">Destaque Final</label>
                  <textarea
                    id="historia_conclusao"
                    value={config.historia_conclusao}
                    onChange={(e) => setConfig({...config, historia_conclusao: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Logística & Agenda</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="data_casamento">Data do Casamento</label>
                  <input
                    id="data_casamento"
                    type="date"
                    value={config.data_casamento}
                    onChange={(e) => setConfig({...config, data_casamento: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="prazo_rsvp">Prazo para Confirmações</label>
                  <input
                    id="prazo_rsvp"
                    type="date"
                    value={config.prazo_rsvp}
                    onChange={(e) => setConfig({...config, prazo_rsvp: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="horario_cerimonia">Hora da Cerimônia</label>
                  <input
                    id="horario_cerimonia"
                    type="time"
                    value={config.horario_cerimonia}
                    onChange={(e) => setConfig({...config, horario_cerimonia: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="horario_recepcao">Hora da Recepção</label>
                  <input
                    id="horario_recepcao"
                    type="time"
                    value={config.horario_recepcao}
                    onChange={(e) => setConfig({...config, horario_recepcao: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="local_cerimonia">Local</label>
                  <input
                    id="local_cerimonia"
                    type="text"
                    value={config.local_cerimonia}
                    onChange={(e) => setConfig({...config, local_cerimonia: e.target.value})}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="endereco_cerimonia">Endereço Completo</label>
                  <input
                    id="endereco_cerimonia"
                    type="text"
                    value={config.endereco_cerimonia}
                    onChange={(e) => setConfig({...config, endereco_cerimonia: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Pagamentos PIX (Presentes)</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="pix_tipo">Tipo de Chave</label>
                  <select 
                    id="pix_tipo"
                    className={styles.select}
                    value={config.pix_tipo}
                    onChange={(e) => setConfig({...config, pix_tipo: e.target.value as any})}
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Celular (Telefone)</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="pix_chave">Chave PIX</label>
                  <input
                    id="pix_chave"
                    type="text"
                    value={config.pix_chave}
                    onChange={(e) => setConfig({...config, pix_chave: e.target.value})}
                    placeholder="Somente números para CPF/Celular"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pix_banco">Banco</label>
                  <input
                    id="pix_banco"
                    type="text"
                    value={config.pix_banco}
                    onChange={(e) => setConfig({...config, pix_banco: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pix_nome">Nome do Beneficiário</label>
                  <input
                    id="pix_nome"
                    type="text"
                    value={config.pix_nome}
                    onChange={(e) => setConfig({...config, pix_nome: e.target.value})}
                  />
                </div>
                </div>
                </section>

                <section className={styles.section}>
                <h2>Mensagem do WhatsApp (Convite)</h2>
                <div className={styles.grid}>
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="whatsapp_template">Template da Mensagem</label>
                   <textarea
                    id="whatsapp_template"
                    rows={4}
                    value={config.whatsapp_template || ''}
                    onChange={(e) => setConfig({...config, whatsapp_template: e.target.value})}
                    placeholder="Use {nome} e {link} para personalizar automaticamente."
                    className={styles.whatsappField}
                  />
                  <div className={styles.helpText}>
                    <p>Variáveis disponíveis: <strong>{'{nome}'}</strong> e <strong>{'{link}'}</strong>.</p>
                  </div>
                  {config.whatsapp_template && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#e7f3ef', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem' }}>Prévia no WhatsApp:</p>
                      <p style={{ fontSize: '0.9rem', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {config.whatsapp_template.replace(/{nome}/g, 'Convidado').replace(/{link}/g, 'invite.com/exemplo')}
                      </p>
                    </div>
                  )}
                </div>
                </div>
                </section>

            {/* Botão obsoleto removido, substituído pela Floating Action Bar */}
          </form>

          <section className={styles.section} style={{ marginTop: '3rem' }}>
            <h2>Perguntas Frequentes (FAQ)</h2>
            <FAQManager eventoId={currentEvent.id} />
          </section>

          <section id="equipe" className={styles.section} style={{ marginTop: '3rem' }}>
            <h2>Equipe de Organizadores</h2>
            <TeamManagement />
          </section>
        </div>

        <aside className={styles.previewColumn}>
          <ConfigPreview config={config} agenda={agenda} />
        </aside>
      </div>

      {/* Notificação Toast de Sucesso */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={styles.toast}
          >
            <div className={styles.toastIcon}>✓</div>
            Configurações salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra Flutuante de Salvar Alterações */}
      <AnimatePresence>
        {isDirty && !saving && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={styles.floatingBar}
          >
            <div className={styles.dirtyText}>
              <span className={styles.dirtyIndicator}></span>
              Alterações não salvas
            </div>
            <div className={styles.floatActions}>
              <button 
                type="button" 
                className={styles.secondaryFloatBtn}
                onClick={() => setConfig(JSON.parse(originalConfigStr))}
              >
                Descartar
              </button>
              <button 
                type="button" 
                className={styles.primaryFloatBtn}
                onClick={(e) => handleSave()}
              >
                Salvar Agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação ao Sair */}
      <AnimatePresence>
        {pendingNavUrl && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>Salvar Alterações?</h3>
              <p>Você realizou alterações nas configurações do convite. O que deseja fazer antes de sair?</p>
              
              <div className={styles.modalButtons}>
                <button 
                  className={styles.modalPrimaryBtn}
                  onClick={(e) => handleSave(undefined, true)}
                >
                  Salvar e Continuar
                </button>
                <button 
                  className={styles.modalSecondaryBtn}
                  onClick={handleDiscardAndLeave}
                >
                  Descartar Alterações
                </button>
                <button 
                  className={styles.modalCancelBtn}
                  onClick={() => setPendingNavUrl(null)}
                >
                  Permanecer na Página
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
