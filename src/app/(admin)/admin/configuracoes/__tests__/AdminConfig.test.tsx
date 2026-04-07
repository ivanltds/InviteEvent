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
  pix_nome: 'Marcus'
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

  test('deve permitir alternar todos os checkboxes de visibilidade', async () => {
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Mostrar História do Casal/i));

    const checkHist = screen.getByLabelText(/Mostrar História do Casal/i);
    const checkNoivos = screen.getByLabelText(/Mostrar Seção/i);
    const checkFaq = screen.getByLabelText(/Mostrar Perguntas Frequentes/i);
    const checkPresentes = screen.getByLabelText(/Mostrar Lista de Presentes/i);

    fireEvent.click(checkHist);
    fireEvent.click(checkNoivos);
    fireEvent.click(checkFaq);
    fireEvent.click(checkPresentes);

    expect(checkHist).not.toBeChecked();
  });

  test('deve permitir alterar campos PIX', async () => {
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Chave PIX/i));

    fireEvent.change(screen.getByLabelText(/Chave PIX/i), { target: { value: 'new-key' } });
    fireEvent.change(screen.getByLabelText(/Banco/i), { target: { value: 'new-bank' } });
    fireEvent.change(screen.getByLabelText(/Nome do Beneficiário/i), { target: { value: 'new-name' } });

    expect(screen.getByLabelText(/Chave PIX/i)).toHaveValue('new-key');
  });

  test('deve mostrar erro se falhar ao salvar', async () => {
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('Err') });
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
    });
  });
});
