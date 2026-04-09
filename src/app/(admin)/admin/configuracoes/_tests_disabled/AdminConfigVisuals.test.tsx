import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('AdminConfig Visual Fields Only', () => {
  const mockConfig = {
    id: 1,
    bg_primary: '#ffffff',
    text_main: '#000000',
    font_cursive: 'Cursive',
    font_serif: 'Serif'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
  });

  test('deve permitir alterar cores', async () => {
    render(<AdminConfig />);
    await waitFor(() => screen.getByLabelText(/Cor de Fundo/i));

    const bgInput = screen.getByLabelText(/Cor de Fundo/i);
    fireEvent.change(bgInput, { target: { value: '#ff0000' } });
    expect(bgInput).toHaveValue('#ff0000');
  });
});
