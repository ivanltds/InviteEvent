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
  eq: jest.fn().mockReturnThis(),
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
    render(<FAQManager eventoId="e1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/P1/)).toBeInTheDocument();
      expect(screen.getByText(/P2/)).toBeInTheDocument();
    });
  });

  test('deve permitir adicionar nova pergunta', async () => {
    render(<FAQManager eventoId="e1" />);
    
    fireEvent.change(screen.getByPlaceholderText('Pergunta'), { target: { value: 'Nova P' } });
    fireEvent.change(screen.getByPlaceholderText('Resposta'), { target: { value: 'Nova R' } });
    fireEvent.change(screen.getByPlaceholderText('Ordem'), { target: { value: '3' } });
    
    fireEvent.click(screen.getByText('Adicionar'));
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{ pergunta: 'Nova P', resposta: 'Nova R', ordem: 3, evento_id: 'e1' }]);
    });
  });

  test('deve permitir editar uma pergunta existente', async () => {
    render(<FAQManager eventoId="e1" />);
    
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
    render(<FAQManager eventoId="e1" />);

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

// Bug reportado pelo usuário em 21/09/2026: "quando eu edito a faq ela
// não esta mudando no casamento atual" — causa raiz era RLS bloqueando
// a leitura/escrita silenciosamente (nenhum erro do Supabase era
// checado, então a tela parecia funcionar mesmo sem salvar nada).
describe('FAQManager — tratamento de erro (não falha mais em silêncio)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  test('mostra uma mensagem quando o carregamento do FAQ falha', async () => {
    mockSelect.mockImplementationOnce(() => ({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'RLS bloqueou a leitura' } }),
    }));

    render(<FAQManager eventoId="e1" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar/i));
  });

  test('mostra uma mensagem quando salvar uma pergunta nova falha (ex.: RLS)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'RLS bloqueou o insert' } });

    render(<FAQManager eventoId="e1" />);
    await waitFor(() => screen.getByText(/P1/));

    fireEvent.change(screen.getByPlaceholderText('Pergunta'), { target: { value: 'Nova P' } });
    fireEvent.change(screen.getByPlaceholderText('Resposta'), { target: { value: 'Nova R' } });
    fireEvent.click(screen.getByText('Adicionar'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível salvar/i));
    // O formulário não deve ser limpo quando falha — o usuário não perde o que digitou.
    expect(screen.getByPlaceholderText('Pergunta')).toHaveValue('Nova P');
  });

  test('mostra uma mensagem quando atualizar uma pergunta falha', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'RLS bloqueou o update' } });

    render(<FAQManager eventoId="e1" />);
    await waitFor(() => screen.getByText(/P1/));

    fireEvent.click(screen.getAllByText('Editar')[0]);
    fireEvent.click(screen.getByText('Atualizar'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível salvar/i));
  });

  test('mostra uma mensagem quando excluir uma pergunta falha', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'RLS bloqueou o delete' } });

    render(<FAQManager eventoId="e1" />);
    await waitFor(() => screen.getByText(/P1/));

    fireEvent.click(screen.getAllByText('Excluir')[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível excluir/i));
  });
});

