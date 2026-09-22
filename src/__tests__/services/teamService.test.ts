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

  describe('updateOrganizerRole', () => {
    it('should promote an organizer to owner', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const success = await eventService.updateOrganizerRole(mockEventId, 'u2', 'owner');
      expect(success).toBe(true);
    });

    it('should prevent demoting the last owner', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ user_id: 'u1' }], error: null }),
          }),
        }),
      });

      await expect(eventService.updateOrganizerRole(mockEventId, 'u1', 'organizador'))
        .rejects.toThrow('O evento precisa ter pelo menos um Proprietário.');
    });
  });

  describe('createTeamInvite and acceptTeamInvite', () => {
    it('should generate a team invite with a token', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'u1' } },
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'inv1', token: 'mock-token-123', role: 'owner' },
              error: null,
            }),
          }),
        }),
      });

      const invite = await eventService.createTeamInvite(mockEventId, 'owner');
      expect(invite.token).toBeDefined();
      expect(invite.role).toBe('owner');
    });

    it('should accept team invite via rpc if available', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'u2', email: 'noivo@test.com' } },
      });

      (supabase as any).rpc = jest.fn().mockResolvedValueOnce({
        data: { success: true, evento_id: mockEventId, evento_nome: 'Casamento', role: 'owner' },
        error: null,
      });

      const res = await eventService.acceptTeamInvite('mock-token-123');
      expect(res.success).toBe(true);
      expect(res.role).toBe('owner');
    });
  });
});
