import { rsvpService } from '@/lib/services/rsvpService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('rsvpService RPC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call the confirm_rsvp RPC with correct parameters', async () => {
    const mockParams = {
      p_convite_id: 'convite-123',
      p_membros: [
        { id: 'm1', confirmado: true, restricoes: 'Vegano' },
        { id: 'm2', confirmado: false, restricoes: '' }
      ],
      p_rsvp_data: {
        confirmados: 1,
        mensagem: 'Parabéns!',
        telefone: '123456789',
        evento_id: 'evento-456'
      }
    };

    (supabase.rpc as jest.Mock).mockResolvedValue({ data: { success: true }, error: null });

    const result = await rsvpService.confirmRSVP(
      mockParams.p_convite_id,
      mockParams.p_membros,
      mockParams.p_rsvp_data
    );

    expect(supabase.rpc).toHaveBeenCalledWith('confirm_rsvp_v1', mockParams);
    expect(result.success).toBe(true);
  });

  it('should return error if RPC fails', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'RPC Error' } });

    const result = await rsvpService.confirmRSVP('id', [], {});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
