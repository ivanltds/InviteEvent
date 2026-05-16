import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PresentesPage from '../page';
import { supabase } from '@/lib/supabase';

// Mock do CldUploadWidget
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onSuccess }: any) => children({ open: () => onSuccess({ info: { secure_url: 'http://proof.url' } }) }),
}));

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

describe('PresentesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockImplementation(fn => Promise.resolve(fn({ data: [], error: null })))
      };
      if (table === 'convites') {
        mockChain.maybeSingle.mockResolvedValue({ 
          data: { id: 'c1', slug: 'test-slug', nome_principal: 'Test', evento_id: 'e1' }, 
          error: null 
        });
      } else if (table === 'presentes') {
        mockChain.then = jest.fn().mockImplementation((fn: any) => Promise.resolve(fn({
          data: [{ id: '1', nome: 'Liquidificador', preco: 250, imagem_url: '/img1.jpg', descricao: 'Desc 1', quantidade_total: 1, quantidade_reservada: 0, status: 'disponivel' }],
          error: null
        })));
      } else if (table === 'configuracoes') {
        mockChain.maybeSingle.mockResolvedValue({ data: { pix_chave: 'key', pix_banco: 'Bank', pix_nome: 'Me', pix_tipo: 'email' }, error: null });
      }
      return mockChain;
    });

    window.history.pushState({}, '', '?invite=test-slug');
  });

  it('deve renderizar o presente e o preço', async () => {
    render(<PresentesPage />);
    await waitFor(() => {
      expect(screen.getByText('Liquidificador')).toBeInTheDocument();
      expect(screen.getByText(/250,00/i)).toBeInTheDocument();
    });
  });

  it('deve abrir modal de PIX com o novo texto', async () => {
    render(<PresentesPage />);
    await waitFor(() => screen.getByText('Liquidificador'));
    
    // Abre o modal
    const verDetalhes = screen.getByText(/Ver Detalhes/i);
    fireEvent.click(verDetalhes);

    await waitFor(() => screen.getByText(/Presentear via PIX/i));
    const btn = screen.getByText(/Presentear via PIX/i);
    fireEvent.click(btn);
    
    expect(screen.getByText(/Sua Cesta de Carinho/i)).toBeInTheDocument();
  });
});
