import { proxy } from '../proxy';

const mockNext = jest.fn(() => ({ status: 200, type: 'next' }));
const mockRedirect = jest.fn((url) => ({ status: 307, url: url.toString(), type: 'redirect' }));

jest.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: any) => mockRedirect(url),
  },
}));

describe('Proxy Admin Auth', () => {
  const createMockRequest = (path: string, cookieValue?: string) => ({
    nextUrl: { pathname: path },
    url: `http://localhost${path}`,
    cookies: {
      get: jest.fn((name) => name === 'admin-auth' && cookieValue ? { value: cookieValue } : undefined),
    },
  });

  test('deve redirecionar se não autorizado em rota admin', () => {
    const req = createMockRequest('/admin/convidados') as any;
    const res = proxy(req);
    expect(mockRedirect).toHaveBeenCalled();
    expect(res?.status).toBe(307);
  });

  test('deve permitir acesso se cookie for válido', () => {
    const pass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@';
    const req = createMockRequest('/admin/convidados', pass) as any;
    const res = proxy(req);
    expect(mockNext).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });
});
