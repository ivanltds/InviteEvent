'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

import { PALETTES } from '@/constants/palettes';
import { CURSIVE_FONTS as FONTS } from '@/constants/fonts';

export default function PublicOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  const [noivaNome, setNoivaNome] = useState('');
  const [noivoNome, setNoivoNome] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(PALETTES[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // STORY-PERSISTENCE: Auto-save e restauração de rascunho. Leitura de
  // localStorage é client-only por natureza — não dá pra fazer isso fora
  // de um efeito sem quebrar a hidratação (SSR não tem localStorage).
  useEffect(() => {
    const saved = localStorage.getItem('pending_invite_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        /* eslint-disable react-hooks/set-state-in-effect -- restauração de rascunho do localStorage, só roda no mount, client-only por natureza */
        if (parsed.noiva_nome) setNoivaNome(parsed.noiva_nome);
        if (parsed.noivo_nome) setNoivoNome(parsed.noivo_nome);
        if (parsed.data_evento) setDataEvento(parsed.data_evento);
        if (parsed.accent_color) {
          const palette = PALETTES.find(p => p.primary === parsed.accent_color);
          if (palette) setSelectedPalette(palette);
        }
        if (parsed.font_cursive) {
          const font = FONTS.find(f => f.cursiveValue === parsed.font_cursive);
          if (font) setSelectedFont(font);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch (e) {
        console.warn('Falha ao restaurar rascunho:', e);
      }
    }
  }, []);

  useEffect(() => {
    const payload = {
      noiva_nome: noivaNome,
      noivo_nome: noivoNome,
      bg_primary: selectedPalette.secondary,
      bg_secondary: selectedPalette.secondary,
      accent_color: selectedPalette.primary,
      font_cursive: selectedFont.cursiveValue,
      font_serif: selectedFont.serifValue,
      data_evento: dataEvento
    };
    try {
      localStorage.setItem('pending_invite_state', JSON.stringify(payload));
    } catch (e) {
      console.warn('Quota de armazenamento estendida, rascunho mantido apenas em memória:', e);
    }
  }, [noivaNome, noivoNome, dataEvento, selectedPalette, selectedFont]);

  const goToStep = (next: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 300);
  };

  const handleFinish = () => {
    if (!selectedPalette || !selectedFont || !dataEvento) {
      console.warn('Finish sem estilo/fonte/data selecionados');
      return;
    }

    const payload = {
      noiva_nome: noivaNome.trim() || 'Julieta',
      noivo_nome: noivoNome.trim() || 'Romeu',
      bg_primary: selectedPalette.secondary,
      bg_secondary: selectedPalette.secondary,
      accent_color: selectedPalette.primary,
      font_cursive: selectedFont.cursiveValue,
      font_serif: selectedFont.serifValue,
      data_evento: dataEvento
    };

    try {
      localStorage.setItem('pending_invite_state', JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage do localStorage cheio, tentando sessionStorage:', e);
      try {
        sessionStorage.setItem('pending_invite_state', JSON.stringify(payload));
      } catch (err) {
        console.warn('Todos os storages locais excedidos, prosseguindo com rascunho em memória:', err);
      }
    }
    router.push('/inv/preview');
  };

  return (
    <>
      {/* Pré-carregar todas as fontes do catálogo para renderização correta dos cards */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?${Array.from(new Set(FONTS.flatMap(f => f.googleFamily.split('|')))).map(family => `family=${family}`).join('&')}&display=swap`}
      />

      <div className={styles.page}>
        <header className={styles.header}>
          <h2 className="cursive" style={{ margin: 0, color: 'var(--admin-accent)', fontSize: '1.6rem' }}>
            Celebraê
          </h2>

          <div className={styles.progressBar}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
            </div>
            <div className={styles.progressSteps}>
              {['Vocês', 'Identidade', 'Tipografia'].map((label, i) => (
                <div key={label} className={`${styles.progressStep} ${step > i ? styles.done : ''} ${step === i + 1 ? styles.current : ''}`}>
                  <div className={styles.progressDot}>{step > i + 1 ? '✓' : i + 1}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className={`${styles.main} ${animating ? styles.fadeOut : styles.fadeIn}`}>

          {/* STEP 1: Nomes */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h1 className="cursive" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
                O seu grande dia merece uma recepção à altura.
              </h1>
              <p className={styles.subtitle}>Vamos começar com o mais importante: vocês.</p>

              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <label className={styles.label}>Nome dela</label>
                  <input
                    placeholder="Ex: Maria"
                    value={noivaNome}
                    onChange={e => setNoivaNome(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <label className={styles.label}>Nome dele</label>
                  <input
                    placeholder="Ex: João"
                    value={noivoNome}
                    onChange={e => setNoivoNome(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              {noivaNome && noivoNome && (
                <div className={styles.preview}>
                  <span style={{ fontFamily: selectedFont.cursiveValue, fontSize: '2.2rem', color: selectedPalette.primary }}>
                    {noivaNome} & {noivoNome}
                  </span>
                </div>
              )}

              <div className={styles.inputWrapper} style={{ marginTop: '1.5rem' }}>
                <label htmlFor="data_evento" className={styles.label}>Data do casamento</label>
                <input
                  id="data_evento"
                  type="date"
                  value={dataEvento}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDataEvento(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.actions}>
                <button onClick={() => goToStep(2)} className={styles.primaryBtn} disabled={!dataEvento}>
                  Continuar ➜
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Paleta de Cores */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h1 className="cursive" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
                As cores dão o tom do sentimento.
              </h1>
              <p className={styles.subtitle}>Qual combinação mais representa vocês?</p>

              <div className={styles.paletteGrid}>
                {PALETTES.map(p => (
                  <div
                    key={p.code}
                    className={`${styles.paletteCard} ${selectedPalette.code === p.code ? styles.selected : ''}`}
                    onClick={() => setSelectedPalette(p)}
                    style={{ '--palette-primary': p.primary, '--palette-secondary': p.secondary } as React.CSSProperties}
                  >
                    <div className={styles.paletteSwatches}>
                      {p.preview.map(color => (
                        <div key={color} className={styles.swatch} style={{ background: color }} />
                      ))}
                    </div>
                    <div className={styles.paletteInfo}>
                      <strong style={{ color: p.primary }}>{p.name}</strong>
                      <span>{p.description}</span>
                    </div>
                    <div className={`${styles.checkmark} ${selectedPalette.code === p.code ? styles.visible : ''}`}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>

              {/* Live preview */}
              <div className={styles.livePreview} style={{ background: selectedPalette.secondary, borderColor: selectedPalette.primary }}>
                <span style={{ fontFamily: "'Pinyon Script', cursive", fontSize: '1.8rem', color: selectedPalette.primary }}>
                  {noivaNome || 'Maria'} & {noivoNome || 'João'}
                </span>
                <p style={{ color: selectedPalette.primary, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>
                  Pré-visualização
                </p>
              </div>

              <div className={styles.actions}>
                <button onClick={() => goToStep(1)} className={styles.backBtn}>← Voltar</button>
                <button onClick={() => goToStep(3)} className={styles.primaryBtn} style={{ background: selectedPalette.primary }}>
                  Adorei! Continuar ➜
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Tipografia */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h1 className="cursive" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
                A letra conta uma história.
              </h1>
              <p className={styles.subtitle}>Escolha a tipografia que combina com o casal.</p>

              <div className={styles.fontGrid}>
                {FONTS.map(f => (
                  <div
                    key={f.code}
                    className={`${styles.fontCard} ${selectedFont.code === f.code ? styles.selected : ''}`}
                    onClick={() => setSelectedFont(f)}
                    style={{ '--palette-primary': selectedPalette.primary } as React.CSSProperties}
                  >
                    <div className={styles.fontSample} style={{ fontFamily: f.cursiveValue, color: selectedPalette.primary }}>
                      {noivaNome || 'Maria'} & {noivoNome || 'João'}
                    </div>
                    <div className={styles.fontInfo}>
                      <strong>{f.name}</strong>
                      <span>{f.description}</span>
                    </div>
                    <div className={`${styles.checkmark} ${selectedFont.code === f.code ? styles.visible : ''}`}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button onClick={() => goToStep(2)} className={styles.backBtn}>← Voltar</button>
                <button onClick={handleFinish} className={styles.primaryBtn} style={{ background: selectedPalette.primary, fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                  Gerar meu convite ✨
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
