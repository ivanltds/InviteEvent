// Testes da guarda de autorização criada em 20/09/2026
// (docs/analise/01-seguranca.md, SEG-08/09/10) que protege as rotas
// internas de admin/suporte/intelligence.

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

import { requireMaster } from '../requireMaster';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const mockGetUser = jest.fn();
const mockRpc = jest.fn();
const mockSupabaseClient = { auth: { getUser: mockGetUser }, rpc: mockRpc };

describe('requireMaster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  it('retorna 401 quando não há sessão', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await requireMaster();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('retorna 403 quando o usuário está logado mas não é master', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockRpc.mockResolvedValue({ data: false, error: null });

    const result = await requireMaster();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(403);
    }
    expect(mockRpc).toHaveBeenCalledWith('check_is_master');
  });

  it('retorna 403 quando a RPC check_is_master falha', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockRpc.mockResolvedValue({ data: null, error: new Error('boom') });

    const result = await requireMaster();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(403);
    }
  });

  it('autoriza quando o usuário é master', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'master-1' } }, error: null });
    mockRpc.mockResolvedValue({ data: true, error: null });

    const result = await requireMaster();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.userId).toBe('master-1');
      expect(result.supabase).toBe(mockSupabaseClient);
    }
  });
});
