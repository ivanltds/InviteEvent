'use client';

import { useState, useEffect } from 'react';
import styles from './AdminConfig.module.css';
import { configService } from '@/lib/services/configService';
import { Configuracao } from '@/lib/types/database';
import FAQManager from '@/components/admin/FAQManager';

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
  font_cursive: "'Playfair Display', cursive",
  font_serif: "'Lora', serif"
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
    const timer = setTimeout(() => {
      fetchConfig();
    }, 0);
    return () => clearTimeout(timer);
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
        <p>Ajuste as informações vitais do seu casamento abaixo.</p>
      </header>

      <form onSubmit={handleSave} className={styles.form}>
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
                placeholder="Descreva a noiva..."
              />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="noivo_bio">Bio do Noivo</label>
              <textarea 
                id="noivo_bio"
                value={config.noivo_bio} 
                onChange={(e) => setConfig({...config, noivo_bio: e.target.value})}
                placeholder="Descreva o noivo..."
              />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="noivos_conclusao">Mensagem de conclusão do casal</label>
              <textarea 
                id="noivos_conclusao"
                value={config.noivos_conclusao} 
                onChange={(e) => setConfig({...config, noivos_conclusao: e.target.value})}
                placeholder="Uma mensagem sobre a união dos dois..."
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Nossa História</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="historia_titulo">Título da História</label>
              <input 
                id="historia_titulo"
                type="text" 
                value={config.historia_titulo} 
                onChange={(e) => setConfig({...config, historia_titulo: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="historia_subtitulo">Subtítulo da História</label>
              <input 
                id="historia_subtitulo"
                type="text" 
                value={config.historia_subtitulo} 
                onChange={(e) => setConfig({...config, historia_subtitulo: e.target.value})}
              />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="historia_texto">Texto da História</label>
              <textarea 
                id="historia_texto"
                value={config.historia_texto} 
                onChange={(e) => setConfig({...config, historia_texto: e.target.value})}
                placeholder="Conte a história do casal..."
                className={styles.tallTextarea}
              />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="historia_conclusao">Destaque final da história</label>
              <textarea 
                id="historia_conclusao"
                value={config.historia_conclusao} 
                onChange={(e) => setConfig({...config, historia_conclusao: e.target.value})}
                placeholder="Uma frase curta e emocionante..."
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Personalização Visual</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="bg_primary">Cor de Fundo</label>
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
              <label htmlFor="text_main">Cor do Texto</label>
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
              <label htmlFor="accent_color">Cor de Destaque</label>
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
          <div className={styles.grid} style={{ marginTop: '1.5rem' }}>
            <div className={styles.field}>
              <label htmlFor="font_cursive">Fonte Cursiva (Nomes)</label>
              <select 
                id="font_cursive"
                value={config.font_cursive}
                onChange={(e) => setConfig({...config, font_cursive: e.target.value})}
              >
                <option value="'Playfair Display', cursive">Playfair Display</option>
                <option value="'Great Vibes', cursive">Great Vibes</option>
                <option value="'Dancing Script', cursive">Dancing Script</option>
                <option value="'Alex Brush', cursive">Alex Brush</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="font_serif">Fonte Serifada (Títulos)</label>
              <select 
                id="font_serif"
                value={config.font_serif}
                onChange={(e) => setConfig({...config, font_serif: e.target.value})}
              >
                <option value="'Lora', serif">Lora</option>
                <option value="'Cinzel', serif">Cinzel</option>
                <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                <option value="'EB Garamond', serif">EB Garamond</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Visibilidade das Seções</h2>
          <div className={styles.checkboxGrid}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={!!config.mostrar_historia} 
                onChange={(e) => setConfig({...config, mostrar_historia: e.target.checked})}
              />
              Mostrar História do Casal
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={!!config.mostrar_noivos} 
                onChange={(e) => setConfig({...config, mostrar_noivos: e.target.checked})}
              />
              Mostrar Seção &quot;Os Noivos&quot;
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={!!config.mostrar_faq} 
                onChange={(e) => setConfig({...config, mostrar_faq: e.target.checked})}
              />
              Mostrar Perguntas Frequentes (FAQ)
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={!!config.mostrar_presentes} 
                onChange={(e) => setConfig({...config, mostrar_presentes: e.target.checked})}
              />
              Mostrar Lista de Presentes no Menu
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Data e Horários</h2>
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
              <label htmlFor="horario_cerimonia">Horário Cerimônia</label>
              <input 
                id="horario_cerimonia"
                type="time" 
                value={config.horario_cerimonia} 
                onChange={(e) => setConfig({...config, horario_cerimonia: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="horario_recepcao">Horário Recepção</label>
              <input 
                id="horario_recepcao"
                type="time" 
                value={config.horario_recepcao} 
                onChange={(e) => setConfig({...config, horario_recepcao: e.target.value})}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Locais e Endereços</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="local_cerimonia">Local da Cerimônia</label>
              <input 
                id="local_cerimonia"
                type="text" 
                value={config.local_cerimonia} 
                onChange={(e) => setConfig({...config, local_cerimonia: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="endereco_cerimonia">Endereço da Cerimônia</label>
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
          <h2>Pagamentos PIX</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="pix_chave">Chave PIX</label>
              <input 
                id="pix_chave"
                type="text" 
                placeholder="CPF, E-mail, Celular ou Aleatória"
                value={config.pix_chave} 
                onChange={(e) => setConfig({...config, pix_chave: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="pix_banco">Banco</label>
              <input 
                id="pix_banco"
                type="text" 
                placeholder="Ex: Nubank, Inter..."
                value={config.pix_banco} 
                onChange={(e) => setConfig({...config, pix_banco: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="pix_nome">Nome do Beneficiário</label>
              <input 
                id="pix_nome"
                type="text" 
                placeholder="Nome completo conforme o banco"
                value={config.pix_nome} 
                onChange={(e) => setConfig({...config, pix_nome: e.target.value})}
              />
            </div>
          </div>
        </section>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      <section className={styles.section} style={{ marginTop: '3rem' }}>
        <h2>Gestão de FAQ (Perguntas Frequentes)</h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>As perguntas adicionadas aqui aparecerão dinamicamente na página inicial.</p>
        <FAQManager />
      </section>
    </main>
  );
}
