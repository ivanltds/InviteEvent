import { configService } from '../configService';
import { supabase } from '@/lib/supabase';

describe('configService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };

  test('getConfig deve retornar configurações', async () => {
    const mockData = { id: 1, noiva_nome: 'L' };
    mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await configService.getConfig('e1');
    expect(result).toEqual(mockData);
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('evento_id', 'e1');
  });

  test('updateConfig deve chamar upsert', async () => {
    mockQueryBuilder.upsert.mockResolvedValueOnce({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const result = await configService.updateConfig('e1', { noiva_nome: 'New' });
    expect(result.success).toBe(true);
    expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ noiva_nome: 'New', evento_id: 'e1' }),
      { onConflict: 'evento_id' }
    );
  });

  test('deve logar erro no getConfig', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'Err' } });
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await configService.getConfig();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
