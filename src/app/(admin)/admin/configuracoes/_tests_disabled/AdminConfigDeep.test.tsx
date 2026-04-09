import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

// Mock do useEvent
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: () => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true },
    refreshEvents: jest.fn(),
    setCurrentEvent: jest.fn(),
  }),
}));

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

jest.mock('@/components/admin/ConfigPreview', () => () => <div data-testid="preview">Preview</div>);

const mockConfig = { 
  id: 1, 
  noiva_nome: 'Layslla', 
  noivo_nome: 'Marcus',
  historia_titulo: 'H1',
  historia_subtitulo: 'S1',
  historia_texto: 'T1',
  historia_conclusao: 'C1'
};

describe('AdminConfig Deep Fields Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
  });

  test('deve permitir alterar todos os textos usando labels exatos', async () => {
    render(<AdminConfig />);
    
    // Esperar sair do loading
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());
    
    // Nova label simplificada para Título (dentro da seção História)
    const inputTitulo = await screen.findByLabelText(/^Título$/);

    fireEvent.change(inputTitulo, { target: { value: 'New T' } });
    fireEvent.change(await screen.findByLabelText(/^Subtítulo$/), { target: { value: 'New S' } });
    fireEvent.change(await screen.findByLabelText(/O Texto da História/i), { target: { value: 'New Text' } });
    fireEvent.change(await screen.findByLabelText(/Destaque Final/i), { target: { value: 'New C' } });

    expect(inputTitulo).toHaveValue('New T');
  });
});
