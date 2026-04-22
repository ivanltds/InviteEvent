import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

describe('RSVP - Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'msg-test' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue('msg-test') });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain = (supabase as any).from().select();
      if (table === 'eventos_config') {
        chain.maybeSingle.mockResolvedValue({ data: { prazo_rsvp: '2026-12-31' }, error: null });
      } else if (table === 'convites') {
        chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', nome_principal: 'João', slug: 'msg-test', evento_id: 'e1' }, error: null });
      }
      return chain;
    });
  });

  it('deve permitir preencher mensagem', async () => {
    render(<RSVP />);
    await waitFor(() => expect(screen.getByPlaceholderText(/escreva uma mensagem/i)).toBeInTheDocument());
    
    fireEvent.change(screen.getByPlaceholderText(/escreva uma mensagem/i), { target: { value: 'Parabéns!' } });
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText('Presença Confirmada!')).toBeInTheDocument();
    });
  });
});
