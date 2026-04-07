import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock do Supabase para simular sucesso no RSVP
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ 
            data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva' }, 
            error: null 
          })),
        })),
        or: jest.fn(() => ({
          limit: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva' }, 
              error: null 
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('RSVP Success Redirection (STORY-017 - TDD)', () => {
  it('should show "Ver Lista de Presentes" button after successful RSVP', async () => {
    render(<RSVP />);
    
    // Find and Submit
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Souza'), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText('Encontrar'));
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    // Este teste deve FALHAR inicialmente pois o botão ainda não foi adicionado à tela de sucesso.
    await waitFor(() => {
      const giftBtn = screen.getByText(/Ver Lista de Presentes/i);
      expect(giftBtn).toBeInTheDocument();
      expect(giftBtn).toHaveAttribute('href', '/presentes');
    });
  });
});
