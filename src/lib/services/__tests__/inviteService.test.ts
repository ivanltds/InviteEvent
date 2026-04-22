import { inviteService } from '../inviteService';
import { supabase } from '@/lib/supabase';

describe('inviteService', () => {
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
    insert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    not: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
  };

  test('getAllInvites deve retornar lista', async () => {
    const mockData = [{ id: '1', nome_principal: 'Teste', rsvp: [] }];
    mockQueryBuilder.then.mockImplementation((fn) => Promise.resolve(fn({ data: mockData, error: null })));
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await inviteService.getAllInvites();
    expect(result).toEqual(mockData);
  });

  test('createInvite deve inserir novo convite', async () => {
    mockQueryBuilder.insert.mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await inviteService.createInvite({ nome_principal: 'Novo' });
    expect(result.success).toBe(true);
  });

  test('updateInvite deve atualizar', async () => {
    mockQueryBuilder.eq.mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await inviteService.updateInvite('1', { nome_principal: 'Edit' });
    expect(result.success).toBe(true);
  });
});
