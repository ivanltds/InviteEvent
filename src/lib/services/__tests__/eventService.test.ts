import { eventService } from '../eventService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
  };
  return {
    supabase: {
      from: jest.fn(() => mockChain),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      }
    },
  };
});

describe('eventService - Emergency Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMyEvents deve funcionar', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } });
    const result = await eventService.getMyEvents();
    expect(Array.isArray(result)).toBe(true);
  });
});
