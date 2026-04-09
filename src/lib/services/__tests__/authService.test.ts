import { authService } from '../authService';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('authService - STORY-039 (Supabase Auth)', () => {
  const MOCK_EMAIL = 'admin@teste.com';
  const MOCK_PASSWORD = 'password123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('deve logar com e-mail e senha e definir cookie de sessão', async () => {
    // 1. Mock do Supabase Auth
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { 
        user: { id: 'user-123' }, 
        session: { access_token: 'jwt-token' } 
      },
      error: null
    });

    // 2. Mock do fetch para o proxy de cookies (STORY-027 pattern)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    const success = await authService.login(MOCK_EMAIL, MOCK_PASSWORD);
    
    expect(success).toBe(true);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.anything());
  });

  it('deve realizar o "claim" automático se o evento não tiver dono', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-owner-id' }, session: { access_token: 'tok' } },
      error: null
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await authService.login(MOCK_EMAIL, MOCK_PASSWORD);

    // Deve tentar atualizar configuracoes onde user_id is null
    expect(supabase.from).toHaveBeenCalledWith('configuracoes');
  });

  it('deve retornar falso em caso de erro no Supabase', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    const success = await authService.login(MOCK_EMAIL, MOCK_PASSWORD);
    expect(success).toBe(false);
  });
});
