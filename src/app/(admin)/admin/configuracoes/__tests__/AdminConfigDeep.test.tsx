import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConfig from '../page';
import { configService } from '@/lib/services/configService';

jest.mock('@/lib/services/configService', () => ({
  configService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

describe('AdminConfig Deep Fields Fixed', () => {
  const mockConfig = {
    id: 1,
    noiva_nome: 'L', noivo_nome: 'M',
    noiva_bio: 'B1', noivo_bio: 'B2',
    historia_titulo: 'T', historia_subtitulo: 'S',
    historia_texto: 'Text', historia_conclusao: 'C',
    local_cerimonia: 'L1', endereco_cerimonia: 'E1',
    pix_chave: 'K', pix_banco: 'B', pix_nome: 'N'
  };

  test('deve permitir alterar todos os textos usando labels exatos', async () => {
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/^Título da História$/));

    fireEvent.change(screen.getByLabelText(/^Título da História$/), { target: { value: 'New T' } });
    fireEvent.change(screen.getByLabelText(/^Subtítulo da História$/), { target: { value: 'New S' } });
    
    expect(screen.getByLabelText(/^Título da História$/)).toHaveValue('New T');
    expect(screen.getByLabelText(/^Subtítulo da História$/)).toHaveValue('New S');
  });
});
