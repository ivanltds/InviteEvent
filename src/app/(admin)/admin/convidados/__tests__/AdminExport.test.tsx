import { render, screen, waitFor } from '@testing-library/react';
import AdminConvidados from '../page';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ 
          data: [{ id: 'c1', nome_principal: 'João Silva', rsvp: [{ confirmados: 2, status: 'confirmado' }] }], 
          error: null 
        })),
      })),
    })),
  },
}));

describe('Admin Export CSV (STORY-015 - TDD)', () => {
  it('should have an "Exportar CSV" button', async () => {
    render(<AdminConvidados />);
    
    // Este teste deve FALHAR inicialmente.
    await waitFor(() => {
      const exportBtn = screen.getByText(/Exportar CSV/i);
      expect(exportBtn).toBeInTheDocument();
    });
  });
});
