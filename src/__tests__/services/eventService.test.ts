import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'e1' }, error: null }),
    })),
  },
}));

describe('eventService', () => {
  const mockUser = { id: 'u1', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  describe('checkSlugAvailability', () => {
    it('should return true if slug is available', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const available = await eventService.checkSlugAvailability('novo-slug');
      expect(available).toBe(true);
    });
  });

  describe('createEvent', () => {
    it('should fail if insert errors', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        const mockChain: any = {
           select: jest.fn().mockReturnThis(),
           eq: jest.fn().mockReturnThis(),
           maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }), // Disponivel
           insert: jest.fn().mockReturnThis(),
           single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert Error' } }),
        };
        return mockChain;
      });

      const { data, error } = await eventService.createEvent('Teste Error');
      expect(error?.message).toBe('Insert Error');
      expect(data).toBeNull();
    });
  });
});
