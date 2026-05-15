import { giftService } from '../giftService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('giftService - Cotas de Presentes (PRD-014)', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('getGiftProgress', () => {
    test('deve retornar progresso e OMITIR link externo se houver cotas compradas > 0', async () => {
      // Mock do Presente
      const mockSingle = jest.fn().mockResolvedValue({
        data: { total_cotas: 10, cotas_compradas: 1, permite_cotas: true, link_externo: 'https://loja.com' },
        error: null
      });
      const mockEqPresente = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelectPresente = jest.fn().mockReturnValue({ eq: mockEqPresente });

      // Mock dos Locks ativos (vamos simular 2 cotas bloqueadas temporariamente)
      const mockGt = jest.fn().mockResolvedValue({
        data: [{ quantidade_cotas: 2 }],
        error: null
      });
      const mockEqLock = jest.fn().mockReturnValue({ gt: mockGt });
      const mockSelectLock = jest.fn().mockReturnValue({ eq: mockEqLock });

      // Injetando no Mock do Supabase Client
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'presentes') return { select: mockSelectPresente };
        if (table === 'presentes_locks') return { select: mockSelectLock };
        return {};
      });

      const progress = await giftService.getGiftProgress('gift-123');

      expect(progress).not.toBeNull();
      expect(progress?.total_cotas).toBe(10);
      expect(progress?.cotas_compradas).toBe(1);
      expect(progress?.cotas_bloqueadas).toBe(2);
      expect(progress?.disponivel).toBe(7); // 10 - (1 + 2)
      
      // REGRA CRÍTICA: Ocultação do link externo se já vendeu cotas
      expect(progress?.link_externo).toBeNull(); 
    });

    test('deve MANTER link externo se cotas compradas for rigorosamente zero', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { total_cotas: 5, cotas_compradas: 0, permite_cotas: true, link_externo: 'https://parceiro.com' },
        error: null
      });
      const mockEqPresente = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelectPresente = jest.fn().mockReturnValue({ eq: mockEqPresente });

      const mockGt = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEqLock = jest.fn().mockReturnValue({ gt: mockGt });
      const mockSelectLock = jest.fn().mockReturnValue({ eq: mockEqLock });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'presentes') return { select: mockSelectPresente };
        if (table === 'presentes_locks') return { select: mockSelectLock };
        return {};
      });

      const progress = await giftService.getGiftProgress('gift-123');
      
      expect(progress?.cotas_compradas).toBe(0);
      expect(progress?.link_externo).toBe('https://parceiro.com');
    });
  });

  describe('reserveGiftFraction', () => {
    test('deve disparar RPC de lock transacional e retornar booleano', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ data: true, error: null });

      const success = await giftService.reserveGiftFraction('p1', 3, 'c1', 's1');
      
      expect(success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('reservar_cotas_presente', {
        p_presente_id: 'p1',
        p_convite_id: 'c1',
        p_session_id: 's1',
        p_quantidade_solicitada: 3
      });
    });

    test('deve retornar false e logar erro se a RPC falhar', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Estoque esgotado' } });

      const success = await giftService.reserveGiftFraction('p1', 1, 'c1', 's1');
      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('updateGiftQuotaConfiguration', () => {
    test('deve bloquear salvamento se a fração resultar em valor < R$ 50 (Regra ACID de Negócios)', async () => {
      // Mock da busca do preço do presente (Geladeira barata de R$ 80 dividida em 2 dá R$ 40/cota)
      const mockSingle = jest.fn().mockResolvedValue({
        data: { preco: 80 },
        error: null
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await giftService.updateGiftQuotaConfiguration('p1', true, 2);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('O valor mínimo por cota deve ser de R$ 50,00');
    });

    test('deve permitir salvar configuração se valor for >= R$ 50 e atualizar banco', async () => {
      // Mock buscar preço: R$ 150 dividido em 3 dá R$ 50 exatos
      const mockSingle = jest.fn().mockResolvedValue({
        data: { preco: 150 },
        error: null
      });
      const mockEqSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqSelect });

      // Mock do Update
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'presentes') {
          // O método first faz SELECT, depois faz o UPDATE
          return { 
            select: mockSelect,
            update: mockUpdate
          };
        }
        return {};
      });

      const result = await giftService.updateGiftQuotaConfiguration('p1', true, 3);
      
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        permite_cotas: true,
        total_cotas: 3
      }));
    });

    test('deve zerar as configurações ao desativar fracionamento', async () => {
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await giftService.updateGiftQuotaConfiguration('p1', false);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        permite_cotas: false,
        total_cotas: null
      }));
    });
  });
});
