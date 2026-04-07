import { render, screen, waitFor } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { supabase } from '@/lib/supabase';

// Mock do Supabase para retornar nomes customizados
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ 
            data: { noiva_nome: 'Noiva Teste', noivo_nome: 'Noivo Teste' }, 
            error: null 
          })),
        })),
      })),
    })),
  },
}));

// Mock do navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

describe('Admin Sidebar Component (TDD)', () => {
  it('should display the couple initials or names from database instead of hardcoded L & M', async () => {
    render(<Sidebar />);
    
    // Esperamos que o componente busque no banco e exiba "N & N" ou os nomes reais
    // Este teste deve FALHAR inicialmente porque o componente tem "L & M" fixo.
    await waitFor(() => {
      const initials = screen.getByText(/N & N/i);
      expect(initials).toBeInTheDocument();
    });
  });
});
