'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  theme?: 'luxo' | 'admin';
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aqui poderíamos registrar o erro em um serviço externo (Sentry) ou interno (Supabase)
    // conforme definido no plano de arquitetura (Sprint 4).
    console.warn('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { theme = 'luxo' } = this.props;
      const themeClass = theme === 'luxo' ? styles['theme-luxo'] : styles['theme-admin'];

      return (
        <div className={`${styles.overlay} ${themeClass}`}>
          <div className={styles.modal}>
            <div className={styles.icon} />
            <h2 className={styles.title}>Tivemos um pequeno tropeço...</h2>
            <p className={styles.message}>
              O sistema está recebendo muitos acessos no momento ou houve um contratempo técnico. 
              Não se preocupe, seus dados estão seguros! <br />
              Deseja tentar processar sua solicitação novamente?
            </p>
            <button 
              className={styles.button} 
              onClick={this.handleRetry}
              aria-label="Tentar de Novo"
            >
              Tentar de Novo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
