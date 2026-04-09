import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';
import { useEvent } from '@/lib/contexts/EventContext';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(() => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  })),
}));

// Mock do FAQManager
jest.mock('@/components/admin/FAQManager', () => () => <div data-testid="faq-manager">FAQ</div>);
// Mock do TeamManagement
jest.mock('@/components/admin/TeamManagement', () => () => <div data-testid="team-management">Team</div>);

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
    
    // Esperar sair do loading
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());
    
    // Agora buscar os elementos
    const inputNoiva = await screen.findByLabelText(/Nome da Noiva/i);
    const inputNoivo = await screen.findByLabelText(/Nome do Noivo/i);
    const bioNoiva = await screen.findByLabelText(/Bio da Noiva/i);
    const bioNoivo = await screen.findByLabelText(/Bio do Noivo/i);

    fireEvent.change(inputNoiva, { target: { value: 'N1' } });
    fireEvent.change(inputNoivo, { target: { value: 'N2' } });
    fireEvent.change(bioNoiva, { target: { value: 'B1' } });
    fireEvent.change(bioNoivo, { target: { value: 'B2' } });

    expect(inputNoiva).toHaveValue('N1');
  });

  test('deve permitir alterar campos PIX', async () => {
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());
    
    const inputChave = await screen.findByLabelText(/Chave PIX/i);
    fireEvent.change(inputChave, { target: { value: 'new-key' } });

    expect(inputChave).toHaveValue('new-key');
  });

  test('deve mostrar erro se falhar ao salvar', async () => {
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('Err') });
    render(<AdminConfig />);
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());
    
    const saveBtn = await screen.findByRole('button', { name: /Salvar Todas as Alterações/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
    });
  });
});
