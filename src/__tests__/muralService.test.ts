import { muralService } from '@/lib/services/muralService';
import { supabase } from '@/lib/supabase';

describe('muralService', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  });

  describe('MESSAGES', () => {
    test('getMessages deve retornar mensagens aprovadas', async () => {
      const mockData = [{ id: '1', mensagem: 'Olá' }];
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.getMessages('e1');
      expect(result).toEqual(mockData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'aprovado');
    });

    test('getMessages deve retornar array vazio e logar erro em caso de falha', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'Erro' } });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.getMessages('e1');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('submitMessage deve inserir mensagem com status pendente', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.submitMessage('e1', 'Convidado', 'Mensagem');
      expect(result).toBe(true);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([expect.objectContaining({
        status: 'pendente'
      })]);
    });

    test('getMessagesForModeration deve retornar todas as mensagens', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getMessagesForModeration('e1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('evento_id', 'e1');
      expect(mockQueryBuilder.order).toHaveBeenCalled();
    });

    test('getMessagesForModeration deve logar erro em caso de falha', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'Erro' } });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getMessagesForModeration('e1');
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('updateMessageStatus deve atualizar status', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.updateMessageStatus('m1', 'aprovado');
      expect(result).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'aprovado' });
    });

    test('deleteMessage deve remover mensagem', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.deleteMessage('m1');
      expect(result).toBe(true);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('PHOTOS', () => {
    test('uploadPhoto deve inserir foto', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.uploadPhoto({ url_foto: 'url' });
      expect(result.success).toBe(true);
    });

    test('getApprovedPhotos deve retornar fotos aprovadas', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getApprovedPhotos('e1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_approved', true);
    });

    test('getApprovedPhotos deve logar erro em caso de falha', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'Erro' } });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.getApprovedPhotos('e1');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('getPhotosForModeration deve retornar fotos', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getPhotosForModeration('e1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('evento_id', 'e1');
    });

    test('getPhotosForModeration deve logar erro em caso de falha', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'Erro' } });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await muralService.getPhotosForModeration('e1');
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('updatePhotoStatus deve atualizar status', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.updatePhotoStatus('p1', true);
      expect(result).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_approved: true });
    });

    test('deletePhoto deve remover foto', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.eq.mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await muralService.deletePhoto('p1');
      expect(result).toBe(true);
    });
  });
});
