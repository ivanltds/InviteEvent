import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPresentes from '../page';
import { supabase } from '@/lib/supabase';
import { useEvent } from '@/lib/contexts/EventContext';

// Mock do EventContext
jest.mock('@/lib/contexts/EventContext', () => ({
  useEvent: jest.fn(() => ({
    currentEvent: { id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' },
    events: [{ id: 'e1', nome: 'Evento Teste', slug: 'evento-teste' }],
    loading: false,
    userProfile: { id: 'u1', is_master: true }
  })),
}));

// Mock do Supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: mockSelect
        })),
        order: mockSelect
      })),
      insert: mockInsert,
      update: mockUpdate,
    }))
  }
}));

// Mock do Cloudinary Widget
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onSuccess }: any) => {
    return children({ 
      open: () => onSuccess({ info: { secure_url: 'http://test.com/img.jpg' } }) 
    });
  }
}));

const mockPresentes = [
  { id: '1', nome: 'Item Teste 1', preco: 100, status: 'disponivel', imagem_url: 'img1.jpg', quantidade_total: 1 },
];

describe('Admin Presentes - Full Lifecycle (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSelect.mockResolvedValue({ data: mockPresentes, error: null });
  });

  test('should list existing gifts', async () => {
    render(<AdminPresentes />);
    await waitFor(() => expect(screen.getByText('Item Teste 1')).toBeInTheDocument());
  });

  test('should add a new gift with image upload and quantity', async () => {
    mockInsert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ 
        data: [{ id: '2', nome: 'Novo Presente', preco: 250, status: 'disponivel', imagem_url: '...', quantidade_total: 5 }], 
        error: null 
      })
    });

    render(<AdminPresentes />);
    
    const openBtn = screen.getByText(/Novo Item/i);
    fireEvent.click(openBtn);

    fireEvent.change(screen.getByLabelText(/Nome do Item/i), { target: { value: 'Novo Presente' } });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Quantidade Total/i), { target: { value: '5' } });

    // Simula Upload (O mock clica e já chama o onSuccess)
    fireEvent.click(screen.getByText(/Subir Foto|Alterar Foto/i));
    
    fireEvent.click(screen.getByText(/Criar Presente|Salvar Presente/i));
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        nome: 'Novo Presente',
        quantidade_total: 5
      })]);
    });
  });

  test('should toggle gift status', async () => {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });

    render(<AdminPresentes />);
    await waitFor(() => expect(screen.getByText('disponivel')).toBeInTheDocument());
    
    const toggleBtn = screen.getByText(/Pausar\/Ativar|Alternar Status/i);
    fireEvent.click(toggleBtn);
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'pausado' });
    });
  });
});
