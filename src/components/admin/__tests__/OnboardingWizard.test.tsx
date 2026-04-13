import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingWizard from '../OnboardingWizard';

const mockOnComplete = jest.fn();

describe('OnboardingWizard Component (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve renderizar a mensagem de boas-vindas inicial', () => {
    render(<OnboardingWizard eventId="e1" onComplete={mockOnComplete} />);
    expect(screen.getByText(/Quem são os noivos\?/i)).toBeInTheDocument();
  });

  test('deve avançar pelos passos do formulário até o fim', async () => {
    render(<OnboardingWizard eventId="e1" onComplete={mockOnComplete} />);
    
    // Passo 1: Nomes dos Noivos
    fireEvent.change(screen.getByPlaceholderText(/Ex: Maria/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: João/i), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText(/Próximo: Identidade Visual/i));

    // Passo 2: Cores (Usando o regex flexível)
    expect(await screen.findByText(/As cores do seu momento/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Próximo: WOW! Ver meu Convite/i));

    // Passo 3: Preview
    expect(await screen.findByText(/WOW! Veja como ficou/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Próximo: Fotos do Casal/i));

    // Passo 4: Protagonistas
    expect(await screen.findByText(/Os Protagonistas/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Próximo: Fotos de Capa/i));
    
    // Passo 5: Capa
    expect(await screen.findByText(/Capa do Site/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Próximo: Ativação/i));

    // Passo 6: Paywall
    expect(await screen.findByText(/Ativação de Convites Necessária/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ir para o Meu Painel/i));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
