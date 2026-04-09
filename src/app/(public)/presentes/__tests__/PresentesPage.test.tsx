import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PresentesPage from '../page';
import { supabase } from '@/lib/supabase';

// Mock do CldUploadWidget
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onSuccess }: any) => children({ open: () => onSuccess({ info: { secure_url: 'http://proof.url' } }) }),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockPresentes = [
  { id: '1', nome: 'Liquidificador', preco: 200, status: 'disponivel', quantidade_total: 1, quantidade_reservada: 0 },
];

const mockConfig = { pix_chave: 'chave-test', pix_banco: 'Banco X', pix_nome: 'Nome Y' };

describe('PresentesPage Public', () => {
  const originalURLSearchParams = global.URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock: valid invite
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('test-slug')
    }));
    
    // Mock do Supabase para carregar dados
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'convites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
        };
      }
      if (table === 'presentes') {
        return {
          select: jest.fn().mockReturnThis(),
          neq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockPresentes, error: null }),
        };
      }
      if (table === 'configuracoes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: mockConfig, error: null }),
        };
      }
      return {};
    });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  test('deve renderizar a lista de presentes quando convidado', async () => {
    render(<PresentesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Liquidificador')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 200,00/)).toBeInTheDocument();
    });
  });

  test('deve mostrar mensagem de acesso restrito quando não houver slug', async () => {
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null)
    }));
    render(<PresentesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    });
  });

  test('deve mostrar mensagem de acesso restrito quando slug for inválido', async () => {
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('invalid-slug')
    }));

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'convites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<PresentesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    });
  });

  test('deve abrir o modal de PIX ao clicar em Presentear e mostrar botões de cópia', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<PresentesPage />);
    
    await waitFor(() => screen.getByText('Liquidificador'));
    
    fireEvent.click(screen.getByText('Presentear'));
    
    expect(screen.getByText('Quase lá!')).toBeInTheDocument();
    expect(screen.getByText('chave-test')).toBeInTheDocument();
    expect(screen.getByText('Copiar Código PIX (Copia e Cola)')).toBeInTheDocument();

    const copyBtn = screen.getByText('Copiar Código PIX (Copia e Cola)');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('Copiado!')).toBeInTheDocument());
  });

  test('deve processar reserva de presente com sucesso após upload', async () => {
    (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ 
      data: { success: true, message: 'Sucesso' }, 
      error: null 
    });

    render(<PresentesPage />);
    
    await waitFor(() => screen.getByText('Liquidificador'));
    fireEvent.click(screen.getByText('Presentear'));
    
    const uploadBtn = screen.getByText('Enviar Comprovante');
    fireEvent.click(uploadBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Muito Obrigado!')).toBeInTheDocument();
    });

    expect(supabase.rpc).toHaveBeenCalledWith('reservar_presente_v1', expect.objectContaining({
      p_presente_id: '1',
      p_url_comprovante: 'http://proof.url'
    }));
  });

  test('deve lidar com erro no RPC de reserva', async () => {
    (supabase.rpc as unknown as jest.Mock).mockRejectedValue(new Error('RPC Error'));
    window.alert = jest.fn();

    render(<PresentesPage />);
    
    await waitFor(() => screen.getByText('Liquidificador'));
    fireEvent.click(screen.getByText('Presentear'));
    
    const uploadBtn = screen.getByText('Enviar Comprovante');
    fireEvent.click(uploadBtn);
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('erro ao processar'));
    });
  });
});
