import { configService } from '../configService';
import { supabase } from '@/lib/supabase';

describe('configService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getConfig deve retornar configurações', async () => {
    const mockData = { id: 1, noiva_nome: 'L' };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await configService.getConfig();
    expect(result).toEqual(mockData);
  });

  test('updateConfig deve chamar update', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

    const result = await configService.updateConfig({ noiva_nome: 'New' });
    expect(result.success).toBe(true);
  });

  test('deve logar erro no getConfig', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Err' } });
    const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

    await configService.getConfig();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
