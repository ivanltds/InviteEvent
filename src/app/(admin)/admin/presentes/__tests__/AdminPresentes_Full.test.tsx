import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPresentes from '../page';
import { supabase } from '@/lib/supabase';

// Mock do Supabase dinâmico
let mockPresentes = [
  { id: '1', nome: 'Item Teste 1', preco: 100, descricao: 'Desc 1', imagem_url: 'img1.jpg', status: 'disponivel', quantidade_total: 1, quantidade_reservada: 0, created_at: new Date().toISOString() }
];

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockPresentes, error: null })),
      })),
      insert: jest.fn((data) => ({
        select: jest.fn(() => {
          const newItem = { ...data[0], id: Date.now().toString(), quantidade_reservada: 0, created_at: new Date().toISOString() };
          mockPresentes.unshift(newItem);
          return Promise.resolve({ data: [newItem], error: null });
        })
      })),
      update: jest.fn((data) => ({
        eq: jest.fn((col, val) => {
          mockPresentes = mockPresentes.map(p => p.id === val ? { ...p, ...data } : p);
          return Promise.resolve({ error: null });
        })
      })),
      delete: jest.fn(() => ({
        eq: jest.fn((col, val) => {
          mockPresentes = mockPresentes.filter(p => p.id !== val);
          return Promise.resolve({ error: null });
        })
      })),
    })),
  },
}));

// Mock do Cloudinary
jest.mock('next-cloudinary', () => ({
  CldUploadWidget: ({ children, onSuccess }: any) => {
    return children({ open: () => onSuccess({ info: { secure_url: 'https://cloudinary.com/new.jpg' } }) });
  },
}));

describe('Admin Presentes - Full Lifecycle (TDD)', () => {
  beforeEach(() => {
    mockPresentes = [
      { id: '1', nome: 'Item Teste 1', preco: 100, descricao: 'Desc 1', imagem_url: 'img1.jpg', status: 'disponivel', quantidade_total: 1, quantidade_reservada: 0, created_at: new Date().toISOString() }
    ];
    jest.clearAllMocks();
  });

  it('should list existing gifts correctly', async () => {
    render(<AdminPresentes />);
    await waitFor(() => {
      expect(screen.getByText('Item Teste 1')).toBeInTheDocument();
      expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    });
  });

  it('should add a new gift with image upload and quantity', async () => {
    render(<AdminPresentes />);
    
    fireEvent.click(screen.getByText(/Novo Item/i));
    
    fireEvent.change(screen.getByLabelText(/Nome do Item:/i), { target: { value: 'Novo Presente' } });
    fireEvent.change(screen.getByLabelText(/Preço \(R\$\):/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Quantidade Total:/i), { target: { value: '5' } });
    
    // Simula Upload
    fireEvent.click(screen.getByText(/Subir Foto/i));
    await waitFor(() => expect(screen.getByText(/Foto Carregada/i)).toBeInTheDocument());
    
    fireEvent.click(screen.getByText(/Salvar Presente/i));
    
    await waitFor(() => {
      const items = screen.getAllByText('Novo Presente');
      expect(items.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/R\$ 250,00/i).length).toBeGreaterThan(0);
    });
  });

  it('should toggle gift status between disponivel and reservado', async () => {
    render(<AdminPresentes />);
    
    await waitFor(() => expect(screen.getByText('disponivel')).toBeInTheDocument());
    
    const toggleBtn = screen.getByText(/Alternar Status/i);
    fireEvent.click(toggleBtn);
    
    await waitFor(() => {
      expect(screen.getByText('reservado')).toBeInTheDocument();
    });
  });

  it('should remove a gift from the list after confirmation', async () => {
    window.confirm = jest.fn(() => true); // Simula OK no confirm
    render(<AdminPresentes />);
    
    await waitFor(() => expect(screen.getByText('Item Teste 1')).toBeInTheDocument());
    
    const deleteBtn = screen.getByText(/Remover/i);
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(screen.queryByText('Item Teste 1')).not.toBeInTheDocument();
    });
  });
});
