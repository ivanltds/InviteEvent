import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page'; // Ajuste o path se necessário
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ 
            data: { noiva_nome: 'Noiva Dinâmica', noivo_nome: 'Noivo Dinâmico', data_casamento: '2026-12-31' }, 
            error: null 
          })),
        })),
      })),
    })),
  },
}));

describe('Home Public Page (TDD)', () => {
  it('should display names from database in the Hero section', async () => {
    render(<Home />);
    
    // Este teste deve FALHAR inicialmente porque a Home tem "Layslla & Marcus" fixo.
    await waitFor(() => {
      expect(screen.getByText(/Noiva Dinâmica & Noivo Dinâmico/i)).toBeInTheDocument();
    });
  });
});
