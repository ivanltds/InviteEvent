import { middleware } from '../middleware';

// Mock simplificado do NextResponse
const mockNext = jest.fn(() => ({ status: 200, type: 'next' }));
const mockRedirect = jest.fn((url) => ({ status: 307, url: url.toString(), type: 'redirect' }));

jest.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: any) => mockRedirect(url),
  },
}));

describe('Middleware de Autenticação Admin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_ADMIN_PASSWORD: 'secure-password' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (path: string, cookieValue?: string) => ({
    nextUrl: {
      pathname: path,
    },
    url: `http://localhost${path}`,
    cookies: {
      get: jest.fn((name) => name === 'admin-auth' && cookieValue ? { value: cookieValue } : undefined),
    },
  });

  test('deve permitir acesso à página de login (/admin)', () => {
    const req = createMockRequest('/admin') as any;
    const res = middleware(req);
    
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });

  test('deve redirecionar rotas internas do admin sem cookie de autenticação', () => {
    const req = createMockRequest('/admin/convidados') as any;
    const res = middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    const redirectUrl = mockRedirect.mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/admin');
    expect(res?.status).toBe(307);
  });

  test('deve permitir acesso com cookie de autenticação válido', () => {
    const req = createMockRequest('/admin/convidados', 'secure-password') as any;
    const res = middleware(req);
    
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });

  test('deve redirecionar com cookie de autenticação inválido', () => {
    const req = createMockRequest('/admin/convidados', 'wrong-password') as any;
    const res = middleware(req);
    
    expect(mockRedirect).toHaveBeenCalled();
    expect(res?.status).toBe(307);
  });

  test('deve ignorar rotas que não sejam admin', () => {
    const req = createMockRequest('/presentes') as any;
    const res = middleware(req);
    
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });
});
