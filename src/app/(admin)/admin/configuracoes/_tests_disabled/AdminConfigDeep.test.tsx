import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

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
    // Nova label simplificada para Título (dentro da seção História)
    await waitFor(() => screen.getByLabelText(/^Título$/));

    fireEvent.change(screen.getByLabelText(/^Título$/), { target: { value: 'New T' } });
    fireEvent.change(screen.getByLabelText(/^Subtítulo$/), { target: { value: 'New S' } });
    fireEvent.change(screen.getByLabelText(/O Texto da História/i), { target: { value: 'New Text' } });
    fireEvent.change(screen.getByLabelText(/Destaque Final/i), { target: { value: 'New C' } });

    expect(screen.getByLabelText(/^Título$/)).toHaveValue('New T');
  });
});
