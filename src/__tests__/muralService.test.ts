import { muralService } from '@/lib/services/muralService';
import { supabase } from '@/lib/supabase';

describe('muralService (Unified)', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  const createMockQueryBuilder = (mockData: any = [], mockError: any = null) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((fn) => {
      return Promise.resolve(fn({ data: mockData, error: mockError }));
    }),
  });

  describe('Unified Items', () => {
    test('getApprovedItems deve retornar itens aprovados', async () => {
      const mockData = [{ id: '1', tipo: 'FOTO', criado_em: '2027-10-10' }];
      const mockQueryBuilder = createMockQueryBuilder(mockData, null);
      const mockEmptyBuilder = createMockQueryBuilder([], null);
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        return table === 'mural_itens' ? mockQueryBuilder : mockEmptyBuilder;
      });

      const result = await muralService.getApprovedItems('e1');
      expect(result).toEqual(mockData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('aprovado', true);
    });

    test('getApprovedItems deve retornar array vazio e logar erro em falha', async () => {
      const mockQueryBuilder = createMockQueryBuilder([], { message: 'Erro' });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.getApprovedItems('e1');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('submitItem deve inserir item com aprovado = false', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.submitItem({ evento_id: 'e1', tipo: 'MENSAGEM', mensagem: 'Test' });
      expect(result.success).toBe(true);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([expect.objectContaining({
        aprovado: false
      })]);
    });

    test('getItemsForModeration deve retornar todos os itens', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getItemsForModeration('e1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('evento_id', 'e1');
      expect(mockQueryBuilder.order).toHaveBeenCalled();
    });

    test('updateItemStatus deve atualizar status', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.updateItemStatus('m1', true);
      expect(result).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ aprovado: true });
    });

    test('deleteItem deve remover item', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.deleteItem('m1');
      expect(result).toBe(true);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
