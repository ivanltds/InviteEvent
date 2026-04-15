import { rsvpService } from '../rsvpService';
import { supabase } from '@/lib/supabase';

describe('rsvpService Members', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getInviteMembers deve retornar lista de membros do convite', async () => {
    const mockMembers = [
      { id: 'm1', nome: 'Membro 1', confirmado: true },
      { id: 'm2', nome: 'Membro 2', confirmado: false }
    ];
    
    const mockOrder = jest.fn().mockResolvedValue({ data: mockMembers, error: null });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await rsvpService.getInviteMembers('convite-123');
    
    expect(supabase.from).toHaveBeenCalledWith('convite_membros');
    expect(mockEq).toHaveBeenCalledWith('convite_id', 'convite-123');
    expect(mockOrder).toHaveBeenCalledWith('nome', { ascending: true });
    expect(result).toEqual(mockMembers);
  });
});
