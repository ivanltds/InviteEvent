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
      const chain = (supabase as any).from().select();
      if (table === 'eventos_config') {
        chain.maybeSingle.mockResolvedValue({ data: { prazo_rsvp: '2026-12-31' }, error: null });
      } else if (table === 'convites') {
        chain.maybeSingle.mockResolvedValue({ data: { id: 'c1', nome_principal: 'João', slug: 'joao', evento_id: 'e1' }, error: null });
      }
      return chain;
    });
  });

  it('deve mostrar link para presentes após confirmar', async () => {
    render(<RSVP />);
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText('Presença Confirmada!')).toBeInTheDocument();
      expect(screen.getByText(/Ver Lista de Presentes/i)).toBeInTheDocument();
    });
  });
});
