'use client';

/**
 * STORY-049: force-dynamic previne prerendering estático em build.
 * Esta página usa hooks (useState/useEffect) e contexto Supabase que
 * não funcionam durante SSG — exige renderização dinâmica no servidor.
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

import styles from './AdminConfig.module.css';
import { configService } from '@/lib/services/configService';
import { Configuracao } from '@/lib/types/database';
import FAQManager from '@/components/admin/FAQManager';
import ConfigPreview from '@/components/admin/ConfigPreview';
import TeamManagement from '@/components/admin/TeamManagement';
import FontPicker from '@/components/admin/FontPicker/FontPicker';
import { useEvent } from '@/lib/contexts/EventContext';

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
  const { currentEvent, loading: eventLoading } = useEvent();
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    if (!currentEvent) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await configService.getConfig(currentEvent.id);
      
      if (data) {
        setConfig(data);
      } else {
        const newPayload = { 
          ...DEFAULT_CONFIG, 
          evento_id: currentEvent.id,
          noiva_nome: 'Noiva',
          noivo_nome: 'Noivo'
        };
        
        const { success, error } = await configService.updateConfig(currentEvent.id, newPayload);
        
        if (success) {
          console.log('[Config] Registro inicial criado. Buscando novamente...');
          const newData = await configService.getConfig(currentEvent.id);
          if (newData) {
            setConfig(newData);
          } else {
            console.error('[Config] Falha ao recuperar registro recém-criado. RLS pode estar bloqueando SELECT.');
            throw new Error('Permissão de leitura negada para o novo registro.');
          }
        } else {
          console.error('[Config] Erro ao criar registro inicial:', error);
          throw error || new Error('Falha na criação do registro de configuração.');
        }
      }
    } catch (err: any) {
      console.error('[Config] Erro crítico:', err);
      alert('Erro ao carregar configurações: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentEvent) {
      fetchConfig();
    } else if (!eventLoading) {
      setLoading(false);
    }
  }, [currentEvent, eventLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !currentEvent) return;

    setSaving(true);
    try {
      // Remove metadata fields before update
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, ...updateData } = config;
      const { success, error } = await configService.updateConfig(currentEvent.id, updateData);

      if (success) {
        alert('Configurações salvas com sucesso!');
      } else {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar configurações: ' + error?.message);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSaving(false);
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
              <h2>Os Noivos</h2>
              <div className={styles.grid}>
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
                    value={config.whatsapp_template}
                    onChange={(e) => setConfig({...config, whatsapp_template: e.target.value})}
                    placeholder="Use {nome} e {link} para personalizar automaticamente."
                    className={styles.textarea}
                  />
                  <p className={styles.helpText}>
                    Variáveis disponíveis: <strong>{'{nome}'}</strong> (Nome do convite) e <strong>{'{link}'}</strong> (Link individual).
                  </p>
                </div>
                </div>
                </section>

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
            </button>
          </form>

          <section className={styles.section} style={{ marginTop: '3rem' }}>
            <h2>Perguntas Frequentes (FAQ)</h2>
            <FAQManager eventoId={currentEvent.id} />
          </section>

          <section className={styles.section} style={{ marginTop: '3rem' }}>
            <h2>Equipe de Organizadores</h2>
            <TeamManagement />
          </section>
        </div>

        <aside className={styles.previewColumn}>
          <ConfigPreview config={config} />
        </aside>
      </div>
    </main>
  );
}
