'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

const PALETTES = [
  {
    code: 'BLUSH',
    name: 'Rosa Blush',
    primary: '#C9837A',
    secondary: '#FDF0EE',
    preview: ['#C9837A', '#F7D6D3', '#FDF0EE'],
    description: 'Delicado, feminino e atemporal'
  },
  {
    code: 'SAGE',
    name: 'Sálvia Verde',
    primary: '#8A9E8C',
    secondary: '#EEF3EE',
    preview: ['#8A9E8C', '#C8D8C9', '#EEF3EE'],
    description: 'Natural, sereno e elegante'
  },
  {
    code: 'CHAMPAGNE',
    name: 'Champagne',
    primary: '#B59A6A',
    secondary: '#FAF5EC',
    preview: ['#B59A6A', '#E8D9BE', '#FAF5EC'],
    description: 'Sofisticado, quente e clássico'
  },
  {
    code: 'LAVENDER',
    name: 'Lavanda',
    primary: '#9189A8',
    secondary: '#F2F0F8',
    preview: ['#9189A8', '#D4CEEA', '#F2F0F8'],
    description: 'Romântico, suave e poético'
  },
  {
    code: 'SKY',
    name: 'Azul Celeste',
    primary: '#7A9EB5',
    secondary: '#EDF4F8',
    preview: ['#7A9EB5', '#BCD4E4', '#EDF4F8'],
    description: 'Fresco, sereno e delicado'
  },
  {
    code: 'DUSTY_ROSE',
    name: 'Rosa Antigo',
    primary: '#B17D8A',
    secondary: '#F8EDEE',
    preview: ['#B17D8A', '#DDB8BF', '#F8EDEE'],
    description: 'Vintage, intimista e charmoso'
  },
];


const FONTS = [
  {
    code: 'PINYON',
    name: 'Pinyon Script',
    cursiveValue: "'Pinyon Script', cursive",
    serifValue: "'Playfair Display', serif",
    sample: 'Layslla & Marcus',
    description: 'Caligrafia clássica — elegância pura',
    googleFonts: 'Pinyon+Script|Playfair+Display'
  },
  {
    code: 'GREAT_VIBES',
    name: 'Great Vibes',
    cursiveValue: "'Great Vibes', cursive",
    serifValue: "'Cormorant Garamond', serif",
    sample: 'Layslla & Marcus',
    description: 'Fluida e moderna — leveza romântica',
    googleFonts: 'Great+Vibes|Cormorant+Garamond'
  },
  {
    code: 'ALEX_BRUSH',
    name: 'Alex Brush',
    cursiveValue: "'Alex Brush', cursive",
    serifValue: "'EB Garamond', serif",
    sample: 'Layslla & Marcus',
    description: 'Pincelada artesanal — intimidade chique',
    googleFonts: 'Alex+Brush|EB+Garamond'
  },
];

export default function PublicOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  const [noivaNome, setNoivaNome] = useState('');
  const [noivoNome, setNoivoNome] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(PALETTES[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);

  const goToStep = (next: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 300);
  };

  const resizeImageAndSave = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 1000;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCoverBase64(await resizeImageAndSave(e.target.files[0]));
    }
  };

  const handleFinish = () => {
    const payload = {
      noiva_nome: noivaNome.trim() || 'Julieta',
      noivo_nome: noivoNome.trim() || 'Romeu',
      bg_primary: selectedPalette.secondary, // Agora fundo é o claro
      bg_secondary: selectedPalette.secondary, 
      accent_color: selectedPalette.primary, // Agora destaque é o forte
      font_cursive: selectedFont.cursiveValue,
      font_serif: selectedFont.serifValue,
      cover_image_url: coverBase64,
      data_evento: '2027-10-10'
    };
    localStorage.setItem('pending_invite_state', JSON.stringify(payload));
    router.push('/inv/preview');
  };

  return (
    <>
      {/* Pré-carregar fontes selecionadas */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${selectedFont.googleFonts.replace('|', '&family=')}&display=swap`}
      />

      <div className={styles.page}>
        <header className={styles.header}>
          <h2 className="cursive" style={{ margin: 0, color: 'var(--admin-accent)', fontSize: '1.6rem' }}>
            InviteEventAI
          </h2>

          <div className={styles.progressBar}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${(step / 4) * 100}%` }} />
            </div>
            <div className={styles.progressSteps}>
              {['Vocês', 'Identidade', 'Tipografia', 'A foto'].map((label, i) => (
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

              <div className={styles.actions}>
                <button onClick={() => goToStep(2)} className={styles.skipBtn}>Deixar padrão</button>
                <button onClick={() => goToStep(2)} className={styles.primaryBtn}>
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
                <button onClick={() => goToStep(4)} className={styles.primaryBtn} style={{ background: selectedPalette.primary }}>
                  Perfeito! Continuar ➜
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Foto de Capa */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <h1 className="cursive" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
                Para fechar: o rosto do evento.
              </h1>
              <p className={styles.subtitle}>Uma foto de vocês. Ela será o destaque do convite.</p>

              <label className={styles.uploadZone} style={{ borderColor: selectedPalette.primary }}>
                {coverBase64 ? (
                  <div className={styles.uploadPreview}>
                    <img src={coverBase64} alt="Capa" />
                    <span style={{ color: selectedPalette.primary }}>✓ Foto carregada</span>
                  </div>
                ) : (
                  <div className={styles.uploadPrompt} style={{ color: selectedPalette.primary }}>
                    <div className={styles.uploadIcon}>📸</div>
                    <strong>Arraste ou clique para escolher</strong>
                    <span>JPG, PNG ou WEBP • Até 10mb</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <div className={styles.actions}>
                <button onClick={() => goToStep(3)} className={styles.backBtn}>← Voltar</button>
                <button onClick={handleFinish} className={styles.skipBtn}>Pular</button>
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
