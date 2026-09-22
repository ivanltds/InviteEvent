import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicOnboarding from '../page';
import { useRouter } from 'next/navigation';
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Public Onboarding UI Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  test('deve avançar pelos 3 passos (nomes+data, cores, tipografia) e gerar o convite', async () => {
    render(<PublicOnboarding />);

    // Step 1: Nomes + Data do casamento
    expect(screen.getByText(/O seu grande dia merece/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Ex: Maria/i), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: João/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/Data do casamento/i), { target: { value: '2027-05-20' } });
    fireEvent.click(screen.getByText('Continuar ➜'));

    // Step 2: Identidade (Cores)
    await waitFor(() => {
      expect(screen.getByText(/As cores dão o tom/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Adorei! Continuar ➜'));

    // Step 3: Tipografia (último passo — já finaliza)
    await waitFor(() => {
      expect(screen.getByText(/A letra conta uma história/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Gerar meu convite ✨'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/inv/preview');
    });

    const saved = JSON.parse(localStorage.getItem('pending_invite_state') || '{}');
    expect(saved.data_evento).toBe('2027-05-20');
    expect(saved.noiva_nome).toBe('Maria');
    expect(saved.noivo_nome).toBe('João');
    expect(['padrao', 'envelope_v3', 'cinematic', 'flower_wind', 'flower_wind_2']).toContain(saved.animacao_tipo);
    expect(saved.cover_image_url).toBeUndefined();
  });

  test('não deixa avançar do passo 1 sem preencher a data do casamento', () => {
    render(<PublicOnboarding />);

    fireEvent.change(screen.getByPlaceholderText(/Ex: Maria/i), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: João/i), { target: { value: 'João' } });

    expect(screen.getByText('Continuar ➜')).toBeDisabled();
  });
});
