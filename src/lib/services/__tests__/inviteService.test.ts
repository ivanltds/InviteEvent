import { inviteService } from '../inviteService';
import { supabase } from '@/lib/supabase';

describe('inviteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllInvites deve retornar lista', async () => {
    const mockData = [{ id: '1', nome_principal: 'Teste', rsvp: [] }];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await inviteService.getAllInvites();
    expect(result).toEqual(mockData);
  });

  test('createInvite deve inserir novo convite', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await inviteService.createInvite({ nome_principal: 'Novo' });
    expect(result.success).toBe(true);
  });

  test('updateInvite deve atualizar', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

    const result = await inviteService.updateInvite('1', { nome_principal: 'Edit' });
    expect(result.success).toBe(true);
  });

  test('deleteInvite deve remover', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

    const result = await inviteService.deleteInvite('1');
    expect(result.success).toBe(true);
  });

  test('deve retornar erro em caso de falha no create', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Erro DB' } });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const result = await inviteService.createInvite({});
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Erro DB');
  });
});
