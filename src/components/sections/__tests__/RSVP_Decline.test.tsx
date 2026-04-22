import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

describe('RSVP - Decline Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'joao-silva' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue('joao-silva') });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain = (supabase as any).from().select(); 
      if (table === 'eventos_config') {
          chain.maybeSingle.mockResolvedValue({ data: { prazo_rsvp: '2026-12-31' }, error: null });
      } else if (table === 'convites') {
          chain.maybeSingle.mockResolvedValue({ 
            data: { id: 'c1', nome_principal: 'João Silva', slug: 'joao-silva', evento_id: 'e1' }, 
            error: null 
          });
      }
      return chain;
    });
  });

  it('deve mostrar mensagem de recusa', async () => {
    render(<RSVP />);
    await waitFor(() => expect(screen.getByLabelText(/poderá celebrar conosco/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/poderá celebrar conosco/i), { target: { value: 'nao' } });
    fireEvent.click(screen.getByText('Confirmar Presença'));
    await waitFor(() => expect(screen.getByText('Poxa, que pena!')).toBeInTheDocument());
  });
});
