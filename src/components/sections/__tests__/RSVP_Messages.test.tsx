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
        chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', nome_principal: 'João', slug: 'msg-test', evento_id: 'e1' }, error: null });
      }
      return chain;
    });
  });

  it('deve permitir preencher mensagem', async () => {
    render(<RSVP inviteSlug="joao-silva" />);
    await waitFor(() => expect(screen.getByPlaceholderText(/escreva algo/i)).toBeInTheDocument());
    
    fireEvent.change(screen.getByPlaceholderText(/escreva algo/i), { target: { value: 'Parabéns!' } });
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText(/presença está confirmada/i)).toBeInTheDocument();
    });
  });
});
