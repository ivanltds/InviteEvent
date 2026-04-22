import { inviteService } from '../inviteService';
import { supabase } from '@/lib/supabase';

describe('inviteService - Member Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'c1', evento_id: 'e1' }, error: null }),
    then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
  };

  test('saveMembers deve inserir ou atualizar membros corretamente', async () => {
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.delete.mockReturnThis();
    mockQueryBuilder.upsert.mockResolvedValue({ error: null });
    mockQueryBuilder.insert.mockResolvedValue({ error: null });

    const mockMembers = [
      { id: 'm1', nome: 'Existente', confirmado: true },
      { id: 'virtual', nome: 'Novo', confirmado: null }
    ];

    const result = await inviteService.saveMembers('c1', mockMembers);
    
    expect(result.success).toBe(true);
    expect(mockQueryBuilder.upsert).toHaveBeenCalled();
    expect(mockQueryBuilder.insert).toHaveBeenCalled();
  });
});
