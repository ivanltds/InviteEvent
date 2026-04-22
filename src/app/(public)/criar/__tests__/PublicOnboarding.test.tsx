import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicOnboarding from '../page';
import { useRouter } from 'next/navigation';

describe('Public Onboarding UI Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('deve avançar pelos passos preenchendo os dados', async () => {
    render(<PublicOnboarding />);
    
    // Step 1: Nomes
    expect(screen.getByText(/O seu grande dia merece/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Ex: Maria/i), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: João/i), { target: { value: 'João' } });
    fireEvent.click(screen.getByText('Continuar ➜'));

    // Step 2: Identidade (Cores)
    await waitFor(() => {
      expect(screen.getByText(/As cores dão o tom/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Adorei! Continuar ➜'));

    // Step 3: Tipografia
    await waitFor(() => {
      expect(screen.getByText(/A letra conta uma história/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Perfeito! Continuar ➜'));

    // Step 4: Foto
    await waitFor(() => {
      expect(screen.getByText(/o rosto do evento/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Gerar meu convite ✨'));

    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith('/inv/preview');
    });
  });
});
