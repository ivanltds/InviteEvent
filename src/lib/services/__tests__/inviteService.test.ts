import { inviteService } from '../inviteService';
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
    },
  };
});

describe('inviteService - Emergency Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllInvites deve retornar lista', async () => {
    const mockData = [{ id: '1' }];
    const mockChain = supabase.from('convites');
    (mockChain.then as jest.Mock).mockImplementationOnce((fn) => Promise.resolve(fn({ data: mockData, error: null })));

    const result = await inviteService.getAllInvites();
    expect(result).toEqual(mockData);
  });

  it('saveMembers deve funcionar', async () => {
    const mockChain = supabase.from('convites');
    (mockChain.single as jest.Mock).mockResolvedValue({ data: { evento_id: 'ev-1' }, error: null });
    
    const result = await inviteService.saveMembers('inv-1', [{ nome: 'A' }]);
    expect(result.success).toBe(true);
  });
});
