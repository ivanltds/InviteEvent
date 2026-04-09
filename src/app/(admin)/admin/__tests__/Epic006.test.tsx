import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfig from '../configuracoes/page';

// Mock do FAQManager
jest.mock('@/components/admin/FAQManager', () => () => <div data-testid="faq-manager">FAQ</div>);
// Mock do TeamManagement
jest.mock('@/components/admin/TeamManagement', () => () => <div data-testid="team-management">Team</div>);

// Mock do useEvent
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(() => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  })),
}));

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
      // Usando regex mais flexível para as novas labels
      expect(screen.getByLabelText(/^Título$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/O Texto da História/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bio da Noiva/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bio do Noivo/i)).toBeInTheDocument();
    });
  });

  test('deve permitir alterar os textos da narrativa', async () => {
    render(<AdminConfig />);
    
    await waitFor(() => {
      const inputTitulo = screen.getByLabelText(/^Título$/i);
      fireEvent.change(inputTitulo, { target: { value: 'Novo Título' } });
      expect(inputTitulo).toHaveValue('Novo Título');
    });
  });
});
