import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
          order: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  },
}));

describe('rsvpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar o upsert de membros ao enviar um RSVP completo', async () => {
    const mockRsvp = { convite_id: '123', confirmados: 2, evento_id: 'evt_1' };
    const mockMembers = [
      { id: 'm1', nome: 'João', confirmado: true, restricoes: 'Vegano' },
      { id: 'm2', nome: 'Maria', confirmado: false }
    ];

    const insertSpy = jest.spyOn(supabase.from('rsvp'), 'insert').mockResolvedValue({ error: null } as any);
    const upsertSpy = jest.spyOn(supabase.from('convite_membros'), 'upsert').mockResolvedValue({ error: null } as any);

    const result = await rsvpService.submitFullRSVP(mockRsvp, mockMembers);

    expect(result.success).toBe(true);
    expect(insertSpy).toHaveBeenCalledWith([mockRsvp]);
    expect(upsertSpy).toHaveBeenCalledWith(mockMembers.map(m => ({
      ...m,
      convite_id: '123',
      evento_id: 'evt_1'
    })));
  });
});
