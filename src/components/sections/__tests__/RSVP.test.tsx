import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock consistente para o encadeamento do Supabase
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = jest.fn().mockResolvedValue({ 
  data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 1, slug: 'joao-silva', prazo_rsvp: '2026-06-13' }, 
  error: null 
});

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  insert: mockInsert,
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockQueryBuilder),
  },
}));

describe('RSVP Component Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve encontrar um convidado e mostrar mensagem de boas-vindas', async () => {
    render(<RSVP />);
    
    const input = screen.getByPlaceholderText('Ex: Família Souza');
    const button = screen.getByText('Encontrar');
    
    fireEvent.change(input, { target: { value: 'João Silva' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Olá,/)).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });

  it('deve permitir recusar o convite', async () => {
    render(<RSVP />);
    
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Souza'), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText('Encontrar'));
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    
    const select = screen.getByLabelText(/Pode confirmar sua presença\?/i);
    fireEvent.change(select, { target: { value: 'nao' } });
    
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText('Poxa, que pena!')).toBeInTheDocument();
    });

    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ status: 'recusado' })]);
  });

  it('deve exibir alerta se exceder o limite de pessoas', async () => {
    render(<RSVP />);
    
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Souza'), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText('Encontrar'));
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    
    const inputQtd = screen.getByLabelText(/Quantas pessoas do seu grupo virão\?/i);
    fireEvent.change(inputQtd, { target: { value: '2' } });
    
    expect(screen.getByText(/Essa quantidade é um pouquinho maior/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText(/Ficamos muito felizes em saber que mais pessoas/i)).toBeInTheDocument();
    });

    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ status: 'excedente_solicitado' })]);
  });

  it('deve lidar com erro ao enviar RSVP', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB Error' } });
    window.alert = jest.fn();

    render(<RSVP />);
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Souza'), { target: { value: 'João Silva' } });
    fireEvent.click(screen.getByText('Encontrar'));
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao enviar'));
    });
  });
});
