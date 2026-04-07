import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { supabase } from '@/lib/supabase';

// Mock do Supabase dinâmico
let mockInvites = [
  { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva', tipo: 'casal', created_at: new Date().toISOString() }
];

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        order: jest.fn(() => {
          if (table === 'convites') {
            return Promise.resolve({ data: mockInvites, error: null });
          }
          return Promise.resolve({ data: [], error: null });
        })
      })),
      insert: jest.fn((data) => {
        const newItem = { ...data[0], id: 'c2', created_at: new Date().toISOString() };
        mockInvites.unshift(newItem); // Adiciona ao mock local
        return Promise.resolve({ 
          data: [newItem], 
          error: null 
        });
      }),
    })),
  },
}));

// Mock do Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Admin Convidados - Fluxo de Criação (TDD)', () => {
  it('should show a new invite in the list immediately after creation', async () => {
    render(<AdminConvidados />);
    
    // Abre o modal
    const addBtn = screen.getByText(/Novo Convite/i);
    fireEvent.click(addBtn);
    
    // Preenche o formulário
    const nameInput = screen.getByLabelText(/Nome do Convite/i);
    fireEvent.change(nameInput, { target: { value: 'Família Teste' } });
    
    const submitBtn = screen.getByText(/Criar Convite/i);
    fireEvent.click(submitBtn);
    
    // Agora deve encontrar pois o mock foi atualizado e a função fetchData chamada
    await waitFor(() => {
      expect(screen.getByText('Família Teste')).toBeInTheDocument();
    });
  });
});
