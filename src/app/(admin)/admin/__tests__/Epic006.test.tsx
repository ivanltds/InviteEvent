import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../configuracoes/page';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ 
        data: { 
          id: 1, 
          noiva_nome: 'Layslla', 
          noivo_nome: 'Marcus',
          historia_titulo: 'Nossa História',
          historia_texto: 'Era uma vez...' 
        }, 
        error: null 
      }),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('EPIC-006: Gestão de Conteúdo Dinâmico', () => {
  
  test('deve exibir campos de edição da narrativa no Admin', async () => {
    render(<AdminConfig />);
    
    // Espera o carregamento inicial
    await waitFor(() => {
      expect(screen.getByLabelText(/^Título da História$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Texto da História$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Bio da Noiva$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Bio do Noivo$/i)).toBeInTheDocument();
    });
  });

  test('deve permitir alterar os textos da narrativa', async () => {
    render(<AdminConfig />);
    
    await waitFor(() => {
      const inputTitulo = screen.getByLabelText(/^Título da História$/i);
      fireEvent.change(inputTitulo, { target: { value: 'Novo Título' } });
      expect(inputTitulo).toHaveValue('Novo Título');
    });
  });
});
