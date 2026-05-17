import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuestStoryMaker } from '../GuestStoryMaker';
import '@testing-library/jest-dom';

// Mock do html2canvas para evitar erros no JSDOM
jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mocked')
  });
});

describe('GuestStoryMaker Component', () => {
  const defaultProps = {
    coupleNames: 'Ana & Pedro',
    eventDate: '12 . 10 . 2026',
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with the classic template by default', () => {
    render(<GuestStoryMaker {...defaultProps} />);
    expect(screen.getByText('Criar Lembrança')).toBeInTheDocument();
    
    // Classic template renderiza o nome e data
    expect(screen.getByText('Ana & Pedro')).toBeInTheDocument();
    expect(screen.getByText('12 . 10 . 2026')).toBeInTheDocument();
    
    // Verifica se os botoes estao presentes
    expect(screen.getByText('SALVAR IMAGEM ✨')).toBeInTheDocument();
  });

  it('changes template when clicking on a selector item', () => {
    render(<GuestStoryMaker {...defaultProps} />);
    
    // Clica no template "Polaroid"
    const polaroidBtn = screen.getByText('Polaroid');
    fireEvent.click(polaroidBtn);
    
    // Verifica se o Polaroid renderiza o texto especifico (aqui podemos checar as classes aplicadas)
    const previewContainer = screen.getByTestId('story-preview-container');
    expect(previewContainer.className).toContain('preview_polaroid');
  });

  it('calls onClose when close button is clicked', () => {
    render(<GuestStoryMaker {...defaultProps} />);
    
    const closeBtn = screen.getByRole('button', { name: /fechar/i });
    fireEvent.click(closeBtn);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles save action and updates state to success screen', async () => {
    render(<GuestStoryMaker {...defaultProps} />);
    
    const saveBtn = screen.getByText('SALVAR IMAGEM ✨');
    fireEvent.click(saveBtn);
    
    expect(screen.getByText('PROCESSANDO... ⏳')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Ficou Incrível!')).toBeInTheDocument();
    });
  });
});
