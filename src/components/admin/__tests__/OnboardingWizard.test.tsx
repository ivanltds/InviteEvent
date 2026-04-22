import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingWizard from '../OnboardingWizard';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Mock ConfigPreview
jest.mock('../ConfigPreview', () => () => <div data-testid="config-preview">Preview</div>);

const mockOnComplete = jest.fn();

describe('OnboardingWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve avançar pelos 3 passos do formulário até o fim', async () => {
    render(<OnboardingWizard eventId="e1" onComplete={mockOnComplete} />);
    
    // Passo 1: Quem são os noivos?
    expect(screen.getByText(/Quem são os noivos\?/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Ex: Maria/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: João/i), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText(/Próximo: Identidade Visual/i));

    // Passo 2: Estilo do Site
    expect(await screen.findByText(/Estilo do Site/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Próximo: WOW! Ver meu Convite/i));

    // Passo 3: Preview
    expect(await screen.findByText(/WOW! Veja como ficou/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Pronto! Ir para o Painel 🎉/i));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('eventos');
    });
  });
});
