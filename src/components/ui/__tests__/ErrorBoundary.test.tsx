import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import '@testing-library/jest-dom';

// Componente que lança um erro propositalmente
const CrashyComponent = () => {
  throw new Error('Crashed!');
};

describe('ErrorBoundary Component (TDD - Fase RED)', () => {
  // Suprime o log de erro do console durante o teste para manter o output limpo
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('deve renderizar os filhos normalmente se não houver erro', () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo Seguro</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Conteúdo Seguro')).toBeInTheDocument();
  });

  test('deve capturar erro e exibir a mensagem empática definida no UX', () => {
    render(
      <ErrorBoundary>
        <CrashyComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Tivemos um pequeno tropeço/i)).toBeInTheDocument();
    expect(screen.getByText(/Não se preocupe, seus dados estão seguros/i)).toBeInTheDocument();
  });

  test('deve renderizar o botão de "Tentar de Novo"', () => {
    render(
      <ErrorBoundary>
        <CrashyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Tentar de Novo/i })).toBeInTheDocument();
  });

  test('deve aplicar o tema correto baseado na prop (Context-Aware)', () => {
    const { container } = render(
      <ErrorBoundary theme="luxo">
        <CrashyComponent />
      </ErrorBoundary>
    );
    
    // Verifica se o container do erro tem a classe de tema correspondente
    const overlay = container.querySelector('[class*="theme-luxo"]');
    expect(overlay).toBeInTheDocument();
  });
});
