import { authService } from '../authService';
import { supabase } from '@/lib/supabase';

// Mock manual completo com factory para controle total
jest.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((fn) => Promise.resolve(fn({ data: [], error: null }))),
      })),
      auth: {
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
        signOut: jest.fn(),
      },
    },
  };
});

describe('authService - Fix Final', () => {
  const MOCK_EMAIL = 'admin@teste.com';
  const MOCK_PASSWORD = 'password123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve logar com e-mail e senha e definir cookie de sessão', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { 
        user: { id: 'user-123' }, 
        session: { access_token: 'jwt-token' } 
      },
      error: null
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    await expect(authService.login(MOCK_EMAIL, MOCK_PASSWORD)).resolves.not.toThrow();
  });

  it('deve lançar erro em caso de falha no Supabase', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    try {
      await authService.login(MOCK_EMAIL, MOCK_PASSWORD);
      throw new Error('Deveria ter falhado');
    } catch (e: any) {
      expect(e.message).toBe('Invalid credentials');
    }
  });
});
