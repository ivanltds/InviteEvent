import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicOnboarding from '../page';
import { useRouter } from 'next/navigation';

// Mock Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('STORY-056: Public Onboarding Funnel Client-Side', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Limpar o LocalStorage
    localStorage.clear();
  });

  test('Renderiza o Step 1 e avança preenchendo os dados', async () => {
    render(<PublicOnboarding />);
    
    // Step 1
    expect(screen.getByText(/O seu grande dia merece/i)).toBeInTheDocument();
    
    const inputNoiva = screen.getByPlaceholderText(/Ex: Maria/i);
    const inputNoivo = screen.getByPlaceholderText(/Ex: João/i);
    
    fireEvent.change(inputNoiva, { target: { value: 'Cleópatra' } });
    fireEvent.change(inputNoivo, { target: { value: 'Marco Antônio' } });
    
    const btnAvancar = screen.getByText(/Continuar/i);
    fireEvent.click(btnAvancar);

    // Step 2
    expect(screen.getByText(/As cores dão o tom/i)).toBeInTheDocument();
    const btnAvancar2 = screen.getByText(/Escolher esta Identidade/i);
    fireEvent.click(btnAvancar2);

    // Avaliamos se ele salvou a metade no localstorage (pode testar no final do fluxo)
  });

  test('Fallback para valores padrões (Romeu e Julieta) se botão pular for clicado', async () => {
    render(<PublicOnboarding />);
    
    const btnPular = screen.getByText(/Deixar Padrão/i);
    fireEvent.click(btnPular);

    // Avança para o Step 2 pulando. Depois vamos pular todos até o preview.
    expect(screen.getByText(/As cores dão o tom/i)).toBeInTheDocument();
    const btnPular2 = screen.getByText(/Escolher esta Identidade/i);
    fireEvent.click(btnPular2);

    // Avançou para o Step 3
    expect(screen.getByText(/O rosto do evento/i)).toBeInTheDocument();
    const btnPular3 = screen.getByText(/Gerar meu Convite Brilhante/i);
    fireEvent.click(btnPular3);
    
    // Ao final, o componente deve rotear para o Preview ou mostrar interface de loading e rotear
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/inv/preview');
    });

    // Verificamos o que foi pro LocalStorage
    const saved = localStorage.getItem('pending_invite_state');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved as string);
    // Como pulamos, os noivos recebem fallback visual (em branco ou dados dummy)
    // Nosso plano disse que injetamos dummy data dinâmico ou no front final lemos como fallback.
    // Vamos garantir que a key está lá.
    expect(parsed).toHaveProperty('noiva_nome');
    expect(parsed).toHaveProperty('noivo_nome');
    expect(parsed.noiva_nome).toBe('Julieta'); // Ou vazio se usarmos placeholder lógico
  });
});
