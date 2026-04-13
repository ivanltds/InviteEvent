/**
 * STORY-049 TDD: Testes do middleware.ts
 * Atualizado de proxy.ts para middleware.ts — STORY-049
 */
import { middleware } from '../middleware';
import { createClient } from '@supabase/supabase-js';

const mockNext = jest.fn(() => ({ status: 200, type: 'next' }));
const mockRedirect = jest.fn((url) => ({
  status: 307,
  url: url.toString(),
  type: 'redirect',
  cookies: { delete: jest.fn() },
}));
const mockRewrite = jest.fn((url) => ({
  status: 200,
  url: url.toString(),
  type: 'rewrite',
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: any) => mockRedirect(url),
    rewrite: (url: any) => mockRewrite(url),
  },
}));

const mockGetUser = jest.fn();
const mockSingle = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  })),
}));

const createMockRequest = (path: string, cookieValue?: string) => ({
  nextUrl: { pathname: path },
  url: `http://localhost${path}`,
  cookies: {
    get: jest.fn((name: string) =>
      name === 'sb-access-token' && cookieValue ? { value: cookieValue } : undefined
    ),
  },
});

describe('STORY-049: middleware de autenticação e ativação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser },
      from: () => ({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      }),
    });
  });

  // =============================================
  // Bloco 1: Passthrough de assets estáticos
  // =============================================
  describe('Assets estáticos — passthrough sem autenticação', () => {
    test('deve passar _next/static sem verificar auth', async () => {
      const req = createMockRequest('/_next/static/chunk.js') as any;
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    test('deve passar /api sem verificar auth', async () => {
      const req = createMockRequest('/api/auth/login') as any;
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    test('deve passar favicon.ico sem verificar auth', async () => {
      const req = createMockRequest('/favicon.ico') as any;
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // =============================================
  // Bloco 2: Proteção de rotas admin
  // =============================================
  describe('Proteção de rotas admin', () => {
    test('deve permitir /admin/login sem token', async () => {
      const req = createMockRequest('/admin/login') as any;
      const res = await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(res?.status).toBe(200);
    });

    test('deve redirecionar /admin/dashboard para login sem token', async () => {
      const req = createMockRequest('/admin/dashboard') as any;
      const res = await middleware(req);
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe('/admin/login');
    });

    test('deve redirecionar /admin/configuracoes para login sem token', async () => {
      const req = createMockRequest('/admin/configuracoes') as any;
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalled();
    });

    test('deve permitir acesso com token válido', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-123' } }, error: null });
      const req = createMockRequest('/admin/convidados', 'valid-jwt') as any;
      const res = await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(res?.status).toBe(200);
    });

    test('deve redirecionar com token inválido no Supabase', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } });
      const req = createMockRequest('/admin/dashboard', 'bad-jwt') as any;
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  // =============================================
  // Bloco 3: Barreira de ativação /inv/
  // =============================================
  describe('Barreira de ativação para /inv/ routes', () => {
    test('deve redirecionar para /manutencao quando evento inativo', async () => {
      mockSingle.mockResolvedValue({
        data: { evento_id: 1, eventos: { is_active: false } },
        error: null,
      });
      const req = createMockRequest('/inv/familia-silva-a8f2') as any;
      await middleware(req);
      expect(mockRewrite).toHaveBeenCalled();
      const rewriteUrl = mockRewrite.mock.calls[0][0] as URL;
      expect(rewriteUrl.pathname).toBe('/manutencao');
    });

    test('deve permitir acesso quando evento está ativo', async () => {
      mockSingle.mockResolvedValue({
        data: { evento_id: 1, eventos: { is_active: true } },
        error: null,
      });
      const req = createMockRequest('/inv/familia-silva-a8f2') as any;
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRewrite).not.toHaveBeenCalled();
    });

    test('deve permitir acesso quando convite não encontrado (página trata o erro)', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });
      const req = createMockRequest('/inv/slug-inexistente') as any;
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // =============================================
  // Bloco 4: Config export
  // =============================================
  describe('Exportação de config do matcher', () => {
    test('config.matcher deve incluir rotas admin e inv', async () => {
      const { config } = await import('../middleware');
      expect(config.matcher).toContain('/admin/:path*');
      expect(config.matcher).toContain('/inv/:path*');
    });
  });
});
