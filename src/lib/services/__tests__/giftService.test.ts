import { giftService } from '../giftService';
import { supabase } from '@/lib/supabase';

const mockGifts = [{ id: '1', nome: 'G1', preco: 100 }];

describe('giftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllGifts deve retornar lista de presentes', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: mockGifts, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await giftService.getAllGifts();
    expect(result).toEqual(mockGifts);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('preco', { ascending: true });
  });

  test('createGift deve inserir presente', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await giftService.createGift({ nome: 'Novo' });
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([{ nome: 'Novo' }]);
  });

  test('updateGift deve atualizar presente', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

    const result = await giftService.updateGift('1', { nome: 'Edit' });
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ nome: 'Edit' });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  test('deleteGift deve excluir presente', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

    const result = await giftService.deleteGift('1');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  test('reserveGift deve chamar RPC', async () => {
    (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ 
      data: { success: true, message: 'OK' }, 
      error: null 
    });

    const result = await giftService.reserveGift('p1', 'url', 'João');
    expect(result.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('reservar_presente_v1', expect.any(Object));
  });

  test('deve lidar com erro no getAllGifts', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await giftService.getAllGifts();
    expect(result).toEqual([]);
  });
});
