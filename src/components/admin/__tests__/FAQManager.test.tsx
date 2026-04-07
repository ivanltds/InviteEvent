import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FAQManager from '../FAQManager';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
const mockFaqs = [
  { id: '1', pergunta: 'P1', resposta: 'R1', ordem: 1 },
  { id: '2', pergunta: 'P2', resposta: 'R2', ordem: 2 },
];

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockResolvedValue({ error: null });
const mockSelect = jest.fn().mockImplementation(() => ({
  order: jest.fn().mockResolvedValue({ data: mockFaqs, error: null }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
    })),
  },
}));

describe('FAQManager Component Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  test('deve listar FAQs ao carregar', async () => {
    render(<FAQManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/P1/)).toBeInTheDocument();
      expect(screen.getByText(/P2/)).toBeInTheDocument();
    });
  });

  test('deve permitir adicionar nova pergunta', async () => {
    render(<FAQManager />);
    
    fireEvent.change(screen.getByPlaceholderText('Pergunta'), { target: { value: 'Nova P' } });
    fireEvent.change(screen.getByPlaceholderText('Resposta'), { target: { value: 'Nova R' } });
    fireEvent.change(screen.getByPlaceholderText('Ordem'), { target: { value: '3' } });
    
    fireEvent.click(screen.getByText('Adicionar'));
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{ pergunta: 'Nova P', resposta: 'Nova R', ordem: 3 }]);
    });
  });

  test('deve permitir editar uma pergunta existente', async () => {
    render(<FAQManager />);
    
    await waitFor(() => screen.getByText(/P1/));
    
    const editBtns = screen.getAllByText('Editar');
    fireEvent.click(editBtns[0]);
    
    expect(screen.getByText('Editar Pergunta')).toBeInTheDocument();
    
    const inputP = screen.getByPlaceholderText('Pergunta');
    fireEvent.change(inputP, { target: { value: 'P1 Editada' } });
    
    fireEvent.click(screen.getByText('Atualizar'));
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ pergunta: 'P1 Editada', resposta: 'R1', ordem: 1 });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  test('deve permitir excluir uma pergunta', async () => {
    render(<FAQManager />);
    
    await waitFor(() => screen.getByText(/P1/));
    
    const deleteBtns = screen.getAllByText('Excluir');
    fireEvent.click(deleteBtns[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });
});
