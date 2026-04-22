import { render, screen, waitFor } from '@testing-library/react';
import RSVP from '../RSVP';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Mock Navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ slug: 'invalid' })),
  useSearchParams: jest.fn(() => ({ get: jest.fn().mockReturnValue(null) })),
}));

describe('RSVP Component - Auth/Access Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show "Acesso Restrito" when no slug is provided', async () => {
    render(<RSVP />);
    
    await waitFor(() => {
      expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
    });
  });
});
