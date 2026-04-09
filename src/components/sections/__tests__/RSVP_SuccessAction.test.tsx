import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = jest.fn();

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  insert: mockInsert,
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockQueryBuilder),
  },
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('RSVP Success Redirection (STORY-017 - TDD)', () => {
  const originalURLSearchParams = global.URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('joao-silva')
    }));
    
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { prazo_rsvp: '2026-06-13' }, error: null })
      .mockResolvedValueOnce({ 
        data: { id: 'c1', nome_principal: 'João Silva', limite_pessoas: 2, slug: 'joao-silva' }, 
        error: null 
      });
  });

  afterAll(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  it('should show "Ver Lista de Presentes" button after successful RSVP', async () => {
    render(<RSVP />);
    
    await waitFor(() => expect(screen.getByText('Confirmar Presença')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirmar Presença'));
    
    await waitFor(() => {
      expect(screen.getByText(/Ver Lista de Presentes/i)).toBeInTheDocument();
    });
  });
});
