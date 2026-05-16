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

describe('AdminConfig Saving Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('deve lidar com erro ao salvar configurações', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ id: 1, noiva_nome: 'L' });
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('DB Fail') });

    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    const form = document.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'), expect.any(Error));
    });
  });
});
