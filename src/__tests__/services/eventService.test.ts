import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
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
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const available = await eventService.checkSlugAvailability('novo-evento');
      expect(available).toBe(true);
    });

    it('should return false if slug is already taken', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'e1' }, error: null }),
          }),
        }),
      });

      const available = await eventService.checkSlugAvailability('evento-existente');
      expect(available).toBe(false);
    });
  });

  describe('createEvent', () => {
    it('should create an event atomically with owner and default config', async () => {
      // Mock slug check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      // Mock event insert
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'e1', nome: 'Teste', slug: 'teste' }, error: null }),
          }),
        }),
      });

      // Mock owner insert
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock config insert
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { data, error } = await eventService.createEvent('Teste');
      
      expect(error).toBeNull();
      expect(data?.id).toBe('e1');
    });

    it('should fail if slug is already taken', async () => {
      // Mock slug check finds something
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'e1' }, error: null }),
          }),
        }),
      });

      const { data, error } = await eventService.createEvent('Evento Existente');
      
      expect(data).toBeNull();
      expect(error?.message).toContain('já está sendo usado');
    });
  });

  describe('getEventStats', () => {
    it('should return combined stats for an event', async () => {
      // Mock convites count
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], count: 2, error: null }),
        }),
      });

      // Mock rsvp count
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ id: 1 }], count: 1, error: null }),
        }),
      });

      const stats = await eventService.getEventStats('e1');
      expect(stats.totalConvites).toBe(2);
      expect(stats.totalConfirmados).toBe(1);
    });
  });
});
