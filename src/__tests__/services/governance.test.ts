import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
  };
  return {
    supabase: {
      from: jest.fn(() => mockChain),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      }
    },
  };
});

describe('Governança de Dados - PRD-005 Services', () => {
  const mockChain = (supabase.from('any') as any);
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockChain.eq.mockReturnValue(mockChain);
  });

  it('deleteEvent deve executar UPDATE com deleted_at em vez de DELETE real', async () => {
    mockChain.then.mockImplementation((fn: any) => fn({ error: null }));
    
    const ok = await eventService.deleteEvent('fake-id');
    
    expect(supabase.from).toHaveBeenCalledWith('eventos');
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(mockChain.delete).not.toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it('restoreEvent deve limpar deleted_at com UPDATE(null)', async () => {
    mockChain.then.mockImplementation((fn: any) => fn({ error: null }));

    const ok = await eventService.restoreEvent('fake-id');
    
    expect(mockChain.update).toHaveBeenCalledWith({ deleted_at: null });
    expect(ok).toBe(true);
  });

  it('getDeletedEvents deve retornar vazio forçadamente para usuários NÃO Master', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } });
    // Mock Perfil as Not Master
    mockChain.maybeSingle.mockResolvedValue({ data: { is_master: false }, error: null });

    const list = await eventService.getDeletedEvents();
    
    expect(list).toEqual([]);
    // Não deve ter tentado buscar os eventos deletados no banco
    expect(mockChain.not).not.toHaveBeenCalled();
  });

  it('getDeletedEvents deve realizar consulta not null para usuários Master', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'admin' } } });
    // Mock Perfil as Master
    mockChain.maybeSingle.mockResolvedValue({ data: { is_master: true }, error: null });
    // Mock query chain final response
    mockChain.then.mockImplementation((fn: any) => fn({ data: [{ id: 'deleted-event' }], error: null }));
    mockChain.not.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);

    const list = await eventService.getDeletedEvents();
    
    expect(mockChain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
    expect(list.length).toBe(1);
  });
});
