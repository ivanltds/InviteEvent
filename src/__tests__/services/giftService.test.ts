import { giftService } from '@/services/giftService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
        })),
        match: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

describe('giftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveGifts', () => {
    it('should call reservar_multiplos_presentes_v2 RPC with correct parameters', async () => {
      const mockParams = {
        presentesIds: ['id1', 'id2'],
        urlComprovante: 'http://example.com/pix.png',
        conviteId: 'convite-id',
        eventoId: 'evento-id',
        convidadoNome: 'João Silva',
        mensagem: 'Felicidades!',
      };

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, message: 'Sucesso' },
        error: null,
      });

      const result = await giftService.reserveGifts(mockParams);

      expect(supabase.rpc).toHaveBeenCalledWith('reservar_multiplos_presentes_v2', {
        p_presentes_ids: mockParams.presentesIds,
        p_url_comprovante: mockParams.urlComprovante,
        p_convite_id: mockParams.conviteId,
        p_evento_id: mockParams.eventoId,
        p_convidado_nome: mockParams.convidadoNome,
        p_mensagem: mockParams.mensagem,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getDashboardKpis', () => {
    it('should calculate total collected from confirmed transactions', async () => {
      const eventoId = 'evento-123';
      
      const mockData = [
        { valor: 100 },
        { valor: 250.50 },
      ];

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        match: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const kpis = await giftService.getDashboardKpis(eventoId);

      expect(mockFrom).toHaveBeenCalledWith('comprovantes');
      expect(kpis.totalArrecadado).toBe(350.50);
    });
  });

  describe('confirmTransaction', () => {
    it('should update transaction status to confirmado', async () => {
      const transactionId = 'trans-123';
      
      const mockFrom = supabase.from as jest.Mock;
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await giftService.confirmTransaction(transactionId);

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmado' });
      expect(mockEq).toHaveBeenCalledWith('id', transactionId);
    });
  });
});
