import { rsvpService } from '../rsvpService';
import { supabase } from '@/lib/supabase';

describe('rsvpService complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getInviteBySlug deve retornar convite', async () => {
    const mockData = { id: '1', slug: 'teste' };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await rsvpService.getInviteBySlug('teste');
    expect(result).toEqual(mockData);
  });

  test('searchInvite deve buscar por slug ou nome', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: '1' }, error: null });
    const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockSelect = jest.fn().mockReturnValue({ or: mockOr });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    await rsvpService.searchInvite('query');
    expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('query'));
  });

  test('submitRSVP deve inserir dados', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await rsvpService.submitRSVP({ nome_principal: 'João' });
    expect(result.success).toBe(true);
  });

  test('submitRSVP deve retornar erro em caso de falha', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await rsvpService.submitRSVP({});
    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Erro');
  });

  test('getRSVPConfig deve retornar config', async () => {
    const mockData = { id: 1 };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await rsvpService.getRSVPConfig();
    expect(result).toEqual(mockData);
  });

  test('deve logar erro se getInviteBySlug falhar', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Fail' } });
    const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    await rsvpService.getInviteBySlug('err');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
