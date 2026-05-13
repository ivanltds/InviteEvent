import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

describe('RSVP - Success Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'joao' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue('joao') });

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
        chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', nome_principal: 'João', slug: 'joao', evento_id: 'e1' }, error: null });
      }
      return chain;
    });
  });

  it('deve mostrar link para presentes após confirmar', async () => {
    render(<RSVP inviteSlug="joao-silva" />);
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText(/presença está confirmada/i)).toBeInTheDocument();
      expect(screen.getByText(/Ver Lista de Presentes/i)).toBeInTheDocument();
    });
  });
});
