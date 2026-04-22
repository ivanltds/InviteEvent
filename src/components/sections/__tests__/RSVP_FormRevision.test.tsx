import { render, screen, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

describe('RSVP - Form Revision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'revision' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue('revision') });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
        const chain = (supabase as any).from().select();
        if (table === 'eventos_config') {
          chain.maybeSingle.mockResolvedValue({ data: { prazo_rsvp: '2026-12-31' }, error: null });
        } else if (table === 'convites') {
          chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', nome_principal: 'João', slug: 'revision', evento_id: 'e1' }, error: null });
        } else if (table === 'rsvp') {
          chain.maybeSingle.mockResolvedValue({ data: { id: 'r1', status: 'confirmado', confirmados: 1 }, error: null });
        }
        return chain;
      });
  });

  it('deve mostrar modo de revisão se rsvp já existir', async () => {
    render(<RSVP />);
    await waitFor(() => {
      expect(screen.getByText(/Revisar Presença/i)).toBeInTheDocument();
    });
  });
});
