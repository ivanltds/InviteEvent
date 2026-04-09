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

describe('AdminConfig Saving Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('deve lidar com erro ao salvar configurações', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue({ id: 1, noiva_nome: 'L' });
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: false, error: new Error('DB Fail') });

    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Nome da Noiva/i));

    fireEvent.click(screen.getByRole('button', { name: /Salvar Todas as Alterações/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
    });
  });
});
