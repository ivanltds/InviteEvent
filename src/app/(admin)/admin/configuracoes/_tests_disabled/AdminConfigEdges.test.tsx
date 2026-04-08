import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

describe('AdminConfig Saving Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('deve lidar com erro ao salvar configurações', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ noiva_nome: 'L' });
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('DB Error') });

    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
    });
  });
});
