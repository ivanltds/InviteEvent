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
      const mockChain = (supabase as any).from().select(); 

      if (table === 'convites') {
        mockChain.maybeSingle.mockResolvedValue({ data: { id: 'c1' }, error: null });
      } else if (table === 'presentes') {
        mockChain.then = (fn: any) => Promise.resolve(fn({
          data: [{ id: '1', nome: 'Liquidificador', preco: 250, imagem_url: '/img1.jpg', descricao: 'Desc 1' }],
          error: null
        }));
      } else if (table === 'configuracoes') {
        mockChain.maybeSingle.mockResolvedValue({ data: { pix_chave: 'key', pix_banco: 'Bank', pix_nome: 'Me' }, error: null });
      }
      return mockChain;
    });

    Object.defineProperty(window, 'location', {
      value: { search: '?inv=test-slug' },
      writable: true
    });
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
    
    const btn = screen.getByText(/Presentear via PIX/i);
    fireEvent.click(btn);
    
    expect(screen.getByText(/Quase lá!/i)).toBeInTheDocument();
  });
});
