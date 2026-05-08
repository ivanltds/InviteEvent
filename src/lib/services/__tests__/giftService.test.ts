import { giftService } from '../giftService';
import { supabase } from '@/lib/supabase';

const mockGifts = [{ id: '1', nome: 'G1', preco: 100 }];

describe('giftService', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('getAllGifts', () => {
    test('deve retornar lista de presentes ordenados por preço', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: mockGifts, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await giftService.getAllGifts();
      expect(result).toEqual(mockGifts);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('preco', { ascending: true });
    });

    test('deve filtrar por eventoId quando fornecido', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: mockGifts, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await giftService.getAllGifts('evt123');
      expect(mockEq).toHaveBeenCalledWith('evento_id', 'evt123');
    });

    test('deve retornar array vazio e logar erro em caso de falha', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await giftService.getAllGifts();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('createGift', () => {
    test('deve inserir presente com sucesso', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await giftService.createGift({ nome: 'Novo' });
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith([{ nome: 'Novo' }]);
    });

    test('deve retornar erro em caso de falha no insert', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Erro insert' } });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await giftService.createGift({});
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Erro insert');
    });
  });

  describe('updateGift', () => {
    test('deve atualizar presente com sucesso', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await giftService.updateGift('1', { nome: 'Edit' });
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ nome: 'Edit' });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    test('deve retornar erro em caso de falha no update', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Erro update' } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await giftService.updateGift('1', {});
      expect(result.success).toBe(false);
    });
  });

  describe('deleteGift', () => {
    test('deve excluir presente com sucesso', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      const result = await giftService.deleteGift('1');
      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    test('deve retornar erro em caso de falha no delete', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Erro delete' } });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      const result = await giftService.deleteGift('1');
      expect(result.success).toBe(false);
    });
  });

  describe('reserveGift', () => {
    test('deve chamar RPC com sucesso', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ 
        data: { success: true, message: 'OK' }, 
        error: null 
      });

      const result = await giftService.reserveGift('p1', 'url', 'João', 'inv1');
      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('reservar_presente_v1', expect.objectContaining({
        p_presente_id: 'p1',
        p_convite_id: 'inv1'
      }));
    });

    test('deve retornar erro e logar caso o RPC falhe', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ 
        data: null, 
        error: { message: 'Erro RPC' } 
      });

      const result = await giftService.reserveGift('p1', 'url', 'João');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao reservar presente.');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
