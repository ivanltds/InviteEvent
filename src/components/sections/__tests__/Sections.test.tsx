import { render, screen, waitFor } from '@testing-library/react';
import Historia from '../Historia';
import OsNoivos from '../OsNoivos';
import Detalhes from '../Detalhes';
import { supabase } from '@/lib/supabase';

describe('Site Sections (Public)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Historia deve carregar dados do banco', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          historia_titulo: 'Título Teste',
          historia_subtitulo: 'Sub Teste',
          historia_texto: 'Era uma vez...',
          historia_conclusao: 'Fim.'
        },
        error: null
      })
    });

    render(<Historia />);
    await waitFor(() => {
      expect(screen.getByText('Título Teste')).toBeInTheDocument();
      expect(screen.getByText('Sub Teste')).toBeInTheDocument();
    });
  });

  test('OsNoivos deve carregar bios do banco', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          noiva_bio: 'Bio da Noiva Teste',
          noivo_bio: 'Bio do Noivo Teste',
          noivos_conclusao: 'Conclusão Casal'
        },
        error: null
      })
    });

    render(<OsNoivos />);
    await waitFor(() => {
      expect(screen.getByText('Bio da Noiva Teste')).toBeInTheDocument();
      expect(screen.getByText('Bio do Noivo Teste')).toBeInTheDocument();
    });
  });

  test('Detalhes deve renderizar informações fixas', () => {
    render(<Detalhes />);
    expect(screen.getByText(/O Evento/i)).toBeInTheDocument();
    expect(screen.getByText(/Cerimônia/i)).toBeInTheDocument();
    expect(screen.getByText(/Recepção/i)).toBeInTheDocument();
  });
});
