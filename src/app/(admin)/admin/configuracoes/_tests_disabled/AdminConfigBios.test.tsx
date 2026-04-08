import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

describe('AdminConfig Bios and More', () => {
  const mockConfig = {
    id: 1,
    noiva_nome: 'L', noivo_nome: 'M',
    noiva_bio: 'B1', noivo_bio: 'B2',
  };

  test('deve permitir alterar bios', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Bio da Noiva/i));

    fireEvent.change(screen.getByLabelText(/Bio da Noiva/i), { target: { value: 'New B1' } });
    fireEvent.change(screen.getByLabelText(/Bio do Noivo/i), { target: { value: 'New B2' } });
    
    expect(screen.getByLabelText(/Bio da Noiva/i)).toHaveValue('New B1');
    expect(screen.getByLabelText(/Bio do Noivo/i)).toHaveValue('New B2');
  });
});
