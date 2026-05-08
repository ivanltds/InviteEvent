import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FinancialWidget from '@/components/admin/FinancialWidget';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockComprovantes, error: null }),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

const mockComprovantes = [
  {
    id: 'c1',
    convidado_nome: 'João Silva',
    valor: 200,
    status: 'pendente',
    url_comprovante: 'https://example.com/pix.jpg',
    created_at: new Date().toISOString()
  }
];

describe('FinancialWidget', () => {
  it('renders pending payments', async () => {
    render(<FinancialWidget eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
    });
  });

  it('allows confirming a payment', async () => {
    const updateMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockComprovantes, error: null }),
      update: jest.fn().mockReturnValue({ eq: updateMock }),
    }));

    render(<FinancialWidget eventId="event-1" />);
    
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);
    });

    expect(updateMock).toHaveBeenCalledWith({ status: 'confirmado' });
  });
});
