import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

// Mock do configService
jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

// Mock do ConfigPreview para evitar carregar Google Fonts nos testes
jest.mock('@/components/admin/ConfigPreview', () => () => <div data-testid="preview">Preview</div>);

const mockConfig = { 
  id: 1, 
  noiva_nome: 'Layslla', 
  noivo_nome: 'Marcus',
  noiva_bio: 'Bio L',
  noivo_bio: 'Bio M',
  mostrar_historia: true,
  mostrar_noivos: true,
  mostrar_faq: true,
  mostrar_presentes: true,
  data_casamento: '2026-06-13',
  pix_chave: '123',
  pix_banco: 'Inter',
  pix_nome: 'Marcus',
  font_cursive: 'Pinyon Script',
  font_serif: 'Playfair Display'
};

describe('AdminConfig Page Exhaustive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    window.alert = jest.fn();
  });

  test('deve permitir alterar todos os campos de texto e bio', async () => {
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    fireEvent.change(screen.getByLabelText(/Nome da Noiva/i), { target: { value: 'N1' } });
    fireEvent.change(screen.getByLabelText(/Nome do Noivo/i), { target: { value: 'N2' } });
    fireEvent.change(screen.getByLabelText(/Bio da Noiva/i), { target: { value: 'B1' } });
    fireEvent.change(screen.getByLabelText(/Bio do Noivo/i), { target: { value: 'B2' } });

    expect(screen.getByLabelText(/Nome da Noiva/i)).toHaveValue('N1');
  });

  test('deve permitir alterar campos PIX', async () => {
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Chave PIX/i));

    fireEvent.change(screen.getByLabelText(/Chave PIX/i), { target: { value: 'new-key' } });

    expect(screen.getByLabelText(/Chave PIX/i)).toHaveValue('new-key');
  });

  test('deve mostrar erro se falhar ao salvar', async () => {
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('Err') });
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    fireEvent.click(screen.getByRole('button', { name: /Salvar Todas as Alterações/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
    });
  });
});
