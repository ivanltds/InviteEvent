import { render, screen, waitFor } from '@testing-library/react';
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

describe('AdminConfig Edge Cases', () => {
  test('deve inicializar com padrão se getConfig retornar null', async () => {
    (configService.getConfig as jest.Mock)
      .mockResolvedValueOnce(null) // Primeiro fetch
      .mockResolvedValueOnce({ noiva_nome: 'Layslla' }); // Segundo fetch após update
    
    (configService.updateConfig as jest.Mock).mockResolvedValue({ success: true });

    render(<AdminConfig />);
    
    await waitFor(() => {
      expect(configService.updateConfig).toHaveBeenCalled();
    });
  });
});
