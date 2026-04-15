import { inviteService } from '../inviteService';
import { supabase } from '@/lib/supabase';

describe('inviteService - Member Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveMembers deve inserir ou atualizar membros corretamente', async () => {
    const mockMembers = [
      { nome: 'Membro A', convite_id: 'c1' },
      { nome: 'Membro B', convite_id: 'c1' }
    ];
    
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const result = await inviteService.saveMembers('c1', mockMembers);
    
    expect(supabase.from).toHaveBeenCalledWith('convite_membros');
    expect(mockUpsert).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
