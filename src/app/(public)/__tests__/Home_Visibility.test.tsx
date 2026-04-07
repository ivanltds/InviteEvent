import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { supabase } from '@/lib/supabase';

// Mock do Supabase para retornar visibilidade desativada
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ 
            data: { 
              noiva_nome: 'L', 
              noivo_nome: 'M', 
              data_casamento: '2026-06-13',
              mostrar_faq: false, // FAQ deve sumir
              mostrar_presentes: true 
            }, 
            error: null 
          })),
        })),
      })),
    })),
  },
}));

describe('Home Visibility Control (TDD)', () => {
  it('should NOT render FAQ section when mostrar_faq is false', async () => {
    render(<Home />);
    
    // O teste deve FALHAR inicialmente porque a Home renderiza o FAQ fixo.
    await waitFor(() => {
      const faqTitle = screen.queryByText(/Perguntas Frequentes/i);
      expect(faqTitle).not.toBeInTheDocument();
    });
  });
});
