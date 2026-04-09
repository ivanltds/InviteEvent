import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingWizard from '../OnboardingWizard';

const mockOnComplete = jest.fn();

describe('OnboardingWizard Component (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve renderizar a mensagem de boas-vindas inicial', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByText(/Vamos preparar o seu grande dia\?/i)).toBeInTheDocument();
  });

  test('deve avançar pelos passos do formulário', async () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Passo 1: Nome do Evento
    fireEvent.change(screen.getByPlaceholderText(/Ex: Casamento de Ana e Bruno/i), {
      target: { value: 'Casamento Teste' }
    });
    fireEvent.click(screen.getByText(/Próximo/i));

    // Passo 2: Nomes do Casal
    expect(await screen.findByText(/Quem são os protagonistas\?/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Nome da Noiva/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Nome do Noivo/i), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText(/Próximo/i));

    // Passo 3: Data
    expect(await screen.findByText(/Quando será a celebração\?/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Data do Casamento/i), { target: { value: '2026-12-25' } });
    fireEvent.click(screen.getByText(/Próximo/i));

    // Passo 4: PIX
    expect(await screen.findByText(/Chave PIX/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Chave PIX/i), { target: { value: 'pix@teste.com' } });
    
    // Finalizar
    fireEvent.click(screen.getByText(/Finalizar e Criar/i));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
        nome: 'Casamento Teste',
        noiva_nome: 'Alice',
        noivo_nome: 'Bob',
        data_casamento: '2026-12-25',
        pix_chave: 'pix@teste.com'
      }));
    });
  });

  test('deve avançar para o próximo passo ao submeter o formulário (Enter)', async () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    const input = screen.getByPlaceholderText(/Ex: Casamento de Ana e Bruno/i);
    fireEvent.change(input, { target: { value: 'Evento Enter' } });
    
    // Simular Submit do form (que é o que acontece no Enter real)
    fireEvent.submit(input.closest('form')!);
    
    // Deve mostrar o próximo passo
    expect(await screen.findByText(/Quem são os protagonistas\?/i)).toBeInTheDocument();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});
