import { proxy } from '../proxy';
import { createClient } from '@supabase/supabase-js';

// Mock simplificado do NextResponse
const mockNext = jest.fn(() => ({ status: 200, type: 'next' }));
const mockRedirect = jest.fn((url) => ({ 
  status: 307, 
  url: url.toString(), 
  type: 'redirect',
  cookies: { delete: jest.fn() }
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: any) => mockRedirect(url),
  },
}));

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

describe('Proxy de Autenticação (SaaS)', () => {
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser }
    });
  });

  const createMockRequest = (path: string, cookieValue?: string) => ({
    nextUrl: { pathname: path },
    url: `http://localhost${path}`,
    cookies: {
      get: jest.fn((name) => name === 'sb-access-token' && cookieValue ? { value: cookieValue } : undefined),
    },
  });

  test('deve permitir acesso à página de login sem token', async () => {
    const req = createMockRequest('/admin/login') as any;
    const res = await proxy(req);
    
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });

  test('deve redirecionar para login se não houver token em rota protegida', async () => {
    const req = createMockRequest('/admin/dashboard') as any;
    const res = await proxy(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe('/admin/login');
  });

  test('deve permitir acesso se o token for válido no Supabase', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
    
    const req = createMockRequest('/admin/dashboard', 'valid-jwt') as any;
    const res = await proxy(req);
    
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });

  test('deve bloquear acesso se o Supabase retornar erro de token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } });
    
    const req = createMockRequest('/admin/dashboard', 'invalid-jwt') as any;
    await proxy(req);
    
    expect(mockRedirect).toHaveBeenCalled();
  });
});
