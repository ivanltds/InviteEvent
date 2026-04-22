import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';

describe('rsvpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };

  it('deve chamar o upsert ao enviar um RSVP completo', async () => {
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
    
    const mockRsvp = { convite_id: 'c1', confirmados: 2, evento_id: 'e1', status: 'confirmado' };
    const mockMembers = [
      { id: 'm1', nome: 'João', confirmado: true },
      { id: 'm2', nome: 'Maria', confirmado: true }
    ];

    const result = await rsvpService.submitFullRSVP(mockRsvp as any, mockMembers as any);

    expect(result.success).toBe(true);
    expect(mockQueryBuilder.upsert).toHaveBeenCalledTimes(2); // Um para rsvp, outro para membros
  });

  it('deve retornar erro se upsert falhar', async () => {
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.upsert.mockResolvedValueOnce({ error: { message: 'UPSERT_FAIL' } });

    const result = await rsvpService.submitFullRSVP({} as any, []);
    expect(result.success).toBe(false);
  });
});
