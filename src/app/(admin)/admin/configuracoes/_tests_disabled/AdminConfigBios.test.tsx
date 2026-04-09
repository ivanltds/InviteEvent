import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock do FAQManager
jest.mock('@/components/admin/FAQManager', () => () => <div data-testid="faq-manager">FAQ</div>);
// Mock do TeamManagement
jest.mock('@/components/admin/TeamManagement', () => () => <div data-testid="team-management">Team</div>);
// Mock do ConfigPreview
jest.mock('@/components/admin/ConfigPreview', () => () => <div data-testid="preview">Preview</div>);

describe('AdminConfig Bios and More', () => {
  const mockConfig = {
    id: 1,
    noiva_nome: 'L', noivo_nome: 'M',
    noiva_bio: 'B1', noivo_bio: 'B2',
    mostrar_historia: true,
    mostrar_noivos: true,
    mostrar_faq: true,
    mostrar_presentes: true,
    data_casamento: '2026-06-13'
  };

  test('deve permitir alterar bios', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    render(<AdminConfig />);

    // Esperar sair do loading
    await waitFor(() => expect(screen.queryByText(/Carregando configurações/i)).not.toBeInTheDocument());

    const inputNoiva = await screen.findByLabelText(/Bio da Noiva/i);
    const inputNoivo = await screen.findByLabelText(/Bio do Noivo/i);

    fireEvent.change(inputNoiva, { target: { value: 'New B1' } });
    fireEvent.change(inputNoivo, { target: { value: 'New B2' } });

    expect(inputNoiva).toHaveValue('New B1');
    expect(inputNoivo).toHaveValue('New B2');
  });
});
