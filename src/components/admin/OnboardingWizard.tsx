'use client';

import { useState } from 'react';
import styles from './AdminComponents.module.css';

interface OnboardingData {
  nome: string;
  noiva_nome: string;
  noivo_nome: string;
  data_casamento: string;
  pix_chave: string;
}

export default function OnboardingWizard({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    nome: '',
    noiva_nome: '',
    noivo_nome: '',
    data_casamento: '',
    pix_chave: ''
  });

  const nextStep = () => {
    if (step < 4) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 4) {
      onComplete(data);
    } else {
      nextStep();
    }
  };

  return (
    <div className={styles.onboardingOverlay}>
      <form className={styles.onboardingCard} onSubmit={handleSubmit}>
        <div className={styles.onboardingProgress}>
          <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {step === 1 && (
          <div className={styles.stepContainer}>
            <span className={styles.emoji}>✨</span>
            <h2>Vamos preparar o seu grande dia?</h2>
            <p>Para começar, qual o nome do seu evento?</p>
            <input 
              type="text" 
              placeholder="Ex: Casamento de Ana e Bruno" 
              value={data.nome}
              onChange={e => setData({...data, nome: e.target.value})}
              required
              autoFocus
              className={styles.onboardingInput}
            />
            <button type="submit" className={styles.primaryBtnLarge} disabled={!data.nome}>
              Próximo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContainer}>
            <span className={styles.emoji}>💍</span>
            <h2>Quem são os protagonistas?</h2>
            <p>Digite os nomes para personalizarmos o site.</p>
            <div className={styles.onboardingFieldGroup}>
              <input 
                type="text" 
                placeholder="Nome da Noiva" 
                value={data.noiva_nome}
                onChange={e => setData({...data, noiva_nome: e.target.value})}
                required
                className={styles.onboardingInput}
              />
              <input 
                type="text" 
                placeholder="Nome do Noivo" 
                value={data.noivo_nome}
                onChange={e => setData({...data, noivo_nome: e.target.value})}
                required
                className={styles.onboardingInput}
              />
            </div>
            <div className={styles.stepActions}>
              <button type="button" className={styles.backBtnGhost} onClick={prevStep}>Voltar</button>
              <button type="submit" className={styles.primaryBtnLarge} disabled={!data.noiva_nome || !data.noivo_nome}>
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContainer}>
            <span className={styles.emoji}>📅</span>
            <h2>Quando será a celebração?</h2>
            <p>Essa data será usada para o contador regressivo.</p>
            <label htmlFor="data_casamento" className={styles.hiddenLabel}>Data do Casamento</label>
            <input 
              id="data_casamento"
              type="date" 
              value={data.data_casamento}
              onChange={e => setData({...data, data_casamento: e.target.value})}
              required
              className={styles.onboardingInput}
            />
            <div className={styles.stepActions}>
              <button type="button" className={styles.backBtnGhost} onClick={prevStep}>Voltar</button>
              <button type="submit" className={styles.primaryBtnLarge} disabled={!data.data_casamento}>
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.stepContainer}>
            <span className={styles.emoji}>🎁</span>
            <h2>Chave PIX</h2>
            <p>Onde você deseja receber os presentes em dinheiro?</p>
            <input 
              type="text" 
              placeholder="Chave PIX (E-mail, CPF, Celular...)" 
              value={data.pix_chave}
              onChange={e => setData({...data, pix_chave: e.target.value})}
              className={styles.onboardingInput}
            />
            <p className={styles.onboardingHint}>Você pode pular isso agora e configurar depois.</p>
            <div className={styles.stepActions}>
              <button type="button" className={styles.backBtnGhost} onClick={prevStep}>Voltar</button>
              <button type="submit" className={styles.primaryBtnLarge}>
                Finalizar e Criar
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
