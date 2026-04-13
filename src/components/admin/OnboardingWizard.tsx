'use client';

import { useState } from 'react';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventService } from '@/lib/services/eventService';
import { galleryService } from '@/lib/services/galleryService';
import { configService } from '@/lib/services/configService';
import { supabase } from '@/lib/supabase';
import * as htmlToImage from 'html-to-image';
import ConfigPreview from './ConfigPreview';
import { useRef } from 'react';
import styles from './OnboardingWizard.module.css';

export default function OnboardingWizard({ eventId, onComplete }: { eventId: string, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    noiva_nome: '',
    noivo_nome: '',
    data_casamento: '',
    bg_primary: '#fdfbf7',
    text_main: '#4a4a4a',
    accent_color: '#8fa89b',
    font_cursive: "'Pinyon Script', cursive",
    font_serif: "'Playfair Display', serif"
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadDemo = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'meu-convite-demo.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setDownloading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinish = async () => {
    setLoading(true);
    // Marcar como completo
    await supabase.from('eventos').update({ onboarding_completed: true }).eq('id', eventId);
    onComplete();
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.step}>
            <h2 className="cursive">Quem são os noivos?</h2>
            <div className={styles.inputGroup}>
              <label>Nome da Noiva</label>
              <input value={formData.noiva_nome} onChange={e => setFormData({...formData, noiva_nome: e.target.value})} placeholder="Ex: Maria" />
            </div>
            <div className={styles.inputGroup}>
              <label>Nome do Noivo</label>
              <input value={formData.noivo_nome} onChange={e => setFormData({...formData, noivo_nome: e.target.value})} placeholder="Ex: João" />
            </div>
            <button onClick={nextStep} className={styles.nextBtn}>Próximo: Identidade Visual</button>
          </div>
        );
      case 2:
        return (
          <div className={styles.step}>
            <h2 className="cursive">Estilo do Site</h2>
            <div className={styles.colors}>
              <div><label>Cor Principal</label><input type="color" value={formData.bg_primary} onChange={e => setFormData({...formData, bg_primary: e.target.value})} /></div>
              <div><label>Cor de Destaque</label><input type="color" value={formData.accent_color} onChange={e => setFormData({...formData, accent_color: e.target.value})} /></div>
            </div>
            <div className={styles.actions}>
              <button onClick={prevStep}>Voltar</button>
              <button onClick={nextStep} className={styles.nextBtn}>Próximo: WOW! Ver meu Convite</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.step}>
            <h2 className="cursive" style={{ textAlign: 'center' }}>WOW! Veja como ficou</h2>
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Este é o visual do seu convite. Que tal salvar uma cópia como imagem para mostrar depois?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
              <div 
                ref={previewRef} 
                style={{ 
                  width: '320px', 
                  height: '480px', 
                  overflow: 'hidden', 
                  position: 'relative', 
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                <ConfigPreview
                    config={{
                      bg_primary: formData.bg_primary,
                      text_main: formData.text_main,
                      accent_color: formData.accent_color,
                      font_cursive: formData.font_cursive,
                      font_serif: formData.font_serif
                    }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <button 
                onClick={handleDownloadDemo}
                disabled={downloading}
                style={{
                  background: 'var(--admin-accent)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: downloading ? 'wait' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {downloading ? 'Gerando Imagem...' : '📸 Baixar como Imagem'}
              </button>
            </div>

            <div className={styles.actions}>
              <button onClick={prevStep}>Voltar</button>
              <button onClick={handleFinish} className={styles.finishBtn}>Pronto! Ir para o Painel 🎉</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onComplete}>&times;</button>
        <div className={styles.progress}>
          <div className={styles.bar} style={{ width: `${(step/3) * 100}%` }}></div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
