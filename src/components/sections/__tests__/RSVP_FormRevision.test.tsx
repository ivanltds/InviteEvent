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
        const mockChain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockImplementation(fn => Promise.resolve(fn({ data: [], error: null })))
      };
      const chain = mockChain;if (table === 'eventos_config') {
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
    render(<RSVP inviteSlug="joao-silva" />);
    await waitFor(() => {
      expect(screen.getByText(/Editar resposta/i)).toBeInTheDocument();
    });
  });
});
