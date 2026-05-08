import { rsvpService } from '../rsvpService';
import { supabase } from '@/lib/supabase';

describe('rsvpService', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('getInviteBySlug', () => {
    test('deve retornar convite quando encontrado', async () => {
      const mockData = { id: '1', slug: 'teste' };
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getInviteBySlug('teste');
      expect(result).toEqual(mockData);
      expect(mockEq).toHaveBeenCalledWith('slug', 'teste');
    });

    test('deve retornar null e logar erro em caso de falha', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro' } });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getInviteBySlug('teste');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('getInviteMembers', () => {
    test('deve retornar membros ordenados por nome', async () => {
      const mockMembers = [{ id: 'm1', nome: 'A' }, { id: 'm2', nome: 'B' }];
      const mockOrder = jest.fn().mockResolvedValue({ data: mockMembers, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getInviteMembers('inv1');
      expect(result).toEqual(mockMembers);
      expect(mockOrder).toHaveBeenCalledWith('nome', { ascending: true });
    });

    test('deve retornar array vazio e logar erro em caso de falha', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro' } });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getInviteMembers('inv1');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('updateMemberStatus', () => {
    test('deve retornar true em caso de sucesso', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.updateMemberStatus('m1', true);
      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ confirmado: true });
    });

    test('deve retornar false em caso de erro', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.updateMemberStatus('m1', false);
      expect(result).toBe(false);
    });
  });

  describe('getExistingRSVP', () => {
    test('deve retornar o RSVP mais recente', async () => {
      const mockRSVP = { id: 'r1', convite_id: 'inv1' };
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockRSVP, error: null });
      const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getExistingRSVP('inv1');
      expect(result).toEqual(mockRSVP);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('deve retornar null em caso de erro', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
      const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: jest.fn().mockReturnValue({ limit: mockLimit }) }) }) });

      const result = await rsvpService.getExistingRSVP('inv1');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('searchInvite', () => {
    test('deve buscar por slug ou nome', async () => {
      const mockData = { id: '1' };
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ or: mockOr });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.searchInvite('query');
      expect(result).toEqual(mockData);
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('query'));
    });

    test('deve retornar null em caso de erro', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
      const mockLimit = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ or: mockOr });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.searchInvite('query');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('submitRSVP', () => {
    test('deve inserir dados com sucesso', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.submitRSVP({ convite_id: '1' });
      expect(result.success).toBe(true);
    });

    test('deve retornar erro em caso de falha', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.submitRSVP({});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('submitFullRSVP', () => {
    test('deve realizar upsert do RSVP e dos membros', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      const rsvpData = { convite_id: 'inv1', evento_id: 'evt1' };
      const members = [{ id: 'm1', nome: 'M1' }];

      const result = await rsvpService.submitFullRSVP(rsvpData, members);
      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    test('deve falhar se o upsert do RSVP falhar', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: { message: 'Erro RSVP' } });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      const result = await rsvpService.submitFullRSVP({}, []);
      expect(result.success).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('deve falhar se o upsert dos membros falhar', async () => {
      const mockUpsert = jest.fn()
        .mockResolvedValueOnce({ error: null }) // RSVP success
        .mockResolvedValueOnce({ error: { message: 'Erro Membros' } }); // Members fail
      
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      const result = await rsvpService.submitFullRSVP({ convite_id: '1' }, [{ id: 'm1' }]);
      expect(result.success).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('não deve tentar upsert de membros se a lista estiver vazia', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      await rsvpService.submitFullRSVP({ convite_id: '1' }, []);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmRSVP', () => {
    test('deve chamar o RPC com sucesso', async () => {
      const mockData = { success: true };
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await rsvpService.confirmRSVP('inv1', [], {});
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    test('deve retornar erro se o RPC falhar', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Erro RPC' } });

      const result = await rsvpService.confirmRSVP('inv1', [], {});
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Erro RPC');
    });
  });

  describe('getRSVPConfig', () => {
    test('deve retornar config padrão sem inviteId', async () => {
      const mockData = { id: 1, cor_principal: '#000' };
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.getRSVPConfig();
      expect(result).toEqual(mockData);
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    test('deve buscar por evento_id se inviteId for fornecido', async () => {
      const mockInvite = { data: { evento_id: 'evt123' }, error: null };
      const mockConfig = { data: { id: 2, evento_id: 'evt123' }, error: null };
      
      const mockSingle = jest.fn().mockResolvedValue(mockInvite);
      const mockEqInvite = jest.fn().mockReturnValue({ single: mockSingle });
      
      const mockMaybeSingle = jest.fn().mockResolvedValue(mockConfig);
      const mockEqConfig = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'convites') return { select: () => ({ eq: mockEqInvite }) };
        if (table === 'configuracoes') return { select: () => ({ eq: mockEqConfig }) };
      });

      const result = await rsvpService.getRSVPConfig('inv1');
      expect(result).toEqual(mockConfig.data);
      expect(mockEqInvite).toHaveBeenCalledWith('id', 'inv1');
      expect(mockEqConfig).toHaveBeenCalledWith('evento_id', 'evt123');
    });

    test('deve usar config id=1 se inviteId não tiver evento_id', async () => {
       const mockInvite = { data: null, error: null };
       const mockConfig = { data: { id: 1 }, error: null };
       
       const mockSingle = jest.fn().mockResolvedValue(mockInvite);
       const mockMaybeSingle = jest.fn().mockResolvedValue(mockConfig);

       (supabase.from as jest.Mock).mockImplementation((table) => {
         if (table === 'convites') return { select: () => ({ eq: () => ({ single: mockSingle }) }) };
         if (table === 'configuracoes') return { select: () => ({ eq: jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) }) };
       });

       const result = await rsvpService.getRSVPConfig('inv1');
       expect(result?.id).toBe(1);
    });

    test('deve retornar null em caso de erro na config', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ error: { message: 'Erro' } });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ eq: mockEq }) });

      const result = await rsvpService.getRSVPConfig();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
