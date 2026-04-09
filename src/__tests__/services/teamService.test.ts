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

describe('eventService - Team Management (STORY-032)', () => {
  const mockEventId = 'e1';
  const mockUserEmail = 'colaborador@test.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addOrganizer', () => {
    it('should add a new organizer if profile exists', async () => {
      // 1. Mock finding the profile by email
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'u2' }, error: null }),
          }),
        }),
      });

      // 2. Mock inserting into evento_organizadores
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const success = await eventService.addOrganizer(mockEventId, mockUserEmail);
      expect(success).toBe(true);
    });

    it('should throw error if profile does not exist', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await expect(eventService.addOrganizer(mockEventId, 'nao-existe@test.com'))
        .rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('removeOrganizer', () => {
    it('should remove an organizer correctly', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const success = await eventService.removeOrganizer(mockEventId, 'u2');
      expect(success).toBe(true);
    });
  });
});
