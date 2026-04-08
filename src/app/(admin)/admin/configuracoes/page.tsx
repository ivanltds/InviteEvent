'use client';

import { useState, useEffect } from 'react';
import styles from './AdminConfig.module.css';
import { configService } from '@/lib/services/configService';
import { Configuracao } from '@/lib/types/database';
import FAQManager from '@/components/admin/FAQManager';
import ConfigPreview from '@/components/admin/ConfigPreview';

const DEFAULT_CONFIG: Omit<Configuracao, 'id'> = {
  noiva_nome: 'Layslla',
  noivo_nome: 'Marcus',
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
  historia_titulo: 'Nossa História',
  historia_subtitulo: 'O Início de Tudo',
  historia_texto: 'Tudo começou através de um amigo distante do primo da noiva...',
  historia_conclusao: 'O dia 13 de junho não é apenas uma data qualquer. Foi o dia em que o pedido de namoro aconteceu, e agora, será o dia em que diremos "sim" para o resto de nossas vidas.',
  noiva_bio: 'Intensa, forte e decidida.',
  noivo_bio: 'Paciente, leve e equilibrado.',
  noivos_conclusao: 'Nossas diferenças não nos afastam, mas nos complementam de forma única. Onde há intensidade, há também paciência. E é justamente nessa união perfeita de temperamentos que encontramos o amor verdadeiro.',
  bg_primary: '#fdfbf7',
  text_main: '#4a4a4a',
  accent_color: '#8fa89b',
  font_cursive: "'Pinyon Script', cursive",
  font_serif: "'Playfair Display', serif"
};

export default function AdminConfig() {
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const data = await configService.getConfig();
    if (data) {
      setConfig(data);
    } else {
      // Initialize with default if not exists
      await configService.updateConfig(DEFAULT_CONFIG);
      const newData = await configService.getConfig();
      setConfig(newData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    // Remove metadata fields before update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...updateData } = config;
    const { success, error } = await configService.updateConfig(updateData);

    if (success) {
      alert('Configurações salvas com sucesso!');
    } else {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações.');
    }
    setSaving(false);
  };

  if (loading || !config) return <div className={styles.loading}>Carregando configurações...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações do Evento</h1>
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

              <div className={styles.grid} style={{ marginTop: '2rem' }}>
                <div className={styles.field}>
                  <label htmlFor="font_cursive">Estilo de Fonte Principal (Nomes)</label>
                  <select
                    id="font_cursive"
                    className={styles.select}
                    value={config.font_cursive}
                    onChange={(e) => setConfig({...config, font_cursive: e.target.value})}
                  >
                    <option value="'Pinyon Script', cursive">Pinyon Script (Clássico)</option>
                    <option value="'Great Vibes', cursive">Great Vibes (Elegante)</option>
                    <option value="'Dancing Script', cursive">Dancing Script (Moderno)</option>
                    <option value="'Alex Brush', cursive">Alex Brush (Fluido)</option>
                    <option value="'Parisienne', cursive">Parisienne (Sofisticado)</option>
                    <option value="'Rochester', cursive">Rochester (Vintage)</option>
                    <option value="'Italianno', cursive">Italianno (Formal)</option>
                    <option value="'Allura', cursive">Allura (Artesanal)</option>
                    <option value="'Homemade Apple', cursive">Homemade Apple (Casual)</option>
                    <option value="'Marck Script', cursive">Marck Script (Expressivo)</option>
                    <option value="'Satisfy', cursive">Satisfy (Amigável)</option>
                    <option value="'Courgette', cursive">Courgette (Legível)</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="font_serif">Estilo de Fonte Serifada (Títulos)</label>
                  <select
                    id="font_serif"
                    className={styles.select}
                    value={config.font_serif}
                    onChange={(e) => setConfig({...config, font_serif: e.target.value})}
                  >
                    <option value="'Playfair Display', serif">Playfair Display (Premium)</option>
                    <option value="'Lora', serif">Lora (Contemporânea)</option>
                    <option value="'Cinzel', serif">Cinzel (Atravessada)</option>
                    <option value="'Cormorant Garamond', serif">Cormorant Garamond (Delicada)</option>
                    <option value="'EB Garamond', serif">EB Garamond (Tradicional)</option>
                    <option value="'Libre Baskerville', serif">Libre Baskerville (Forte)</option>
                    <option value="'Cardo', serif">Cardo (Acadêmica)</option>
                    <option value="'Marcellus', serif">Marcellus (Escultural)</option>
                    <option value="'Prata', serif">Prata (Moderna)</option>
                  </select>
                </div>
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
                  <label htmlFor="prazo_rsvp">Prazo Limite RSVP</label>
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
                  <label htmlFor="pix_chave">Chave PIX</label>
                  <input
                    id="pix_chave"
                    type="text"
                    value={config.pix_chave}
                    onChange={(e) => setConfig({...config, pix_chave: e.target.value})}
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
                <div className={styles.fieldFull}>
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

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
            </button>
          </form>

          <section className={styles.section} style={{ marginTop: '3rem' }}>
            <h2>Perguntas Frequentes (FAQ)</h2>
            <FAQManager />
          </section>
        </div>

        <aside className={styles.previewColumn}>
          <ConfigPreview config={config} />
        </aside>
      </div>
    </main>
  );
}
