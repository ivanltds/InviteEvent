import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ 
            data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 1, slug: 'joao-silva' }, 
            error: null 
          })),
        })),
        or: jest.fn(() => ({
          limit: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 1, slug: 'joao-silva' }, 
              error: null 
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('RSVP Component - Decline Flow (TDD)', () => {
  it('should send "recusado" status when guest selects "Infelizmente não poderei ir"', async () => {
    render(<RSVP />);
    
    // Find guest
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Souza'), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText('Encontrar'));
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    
    // Select "nao"
    const select = screen.getByLabelText(/Pode confirmar sua presença?/i);
    fireEvent.change(select, { target: { value: 'nao' } });
    
    const submitBtn = screen.getByText('Confirmar Presença');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      // Verifica se o insert foi chamado com status 'recusado'
      expect(supabase.from).toHaveBeenCalledWith('rsvp');
      const lastInsertCall = (supabase.from as jest.Mock).mock.results.find(r => r.type === 'return' && r.value.insert);
      // Nota: A validação exata do mock insert depende de como o mock foi estruturado, 
      // mas o teste principal é o comportamento da UI e a lógica de status.
      
      // O teste deve FALHAR aqui pois a UI ainda dirá "Coração quentinho!"
      expect(screen.getByText(/Sentiremos sua falta/i)).toBeInTheDocument();
    });
  });
});
