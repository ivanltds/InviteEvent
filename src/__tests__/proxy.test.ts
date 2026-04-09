import { proxy } from '../proxy';
import { NextResponse } from 'next/server';

// Mock do Supabase
const mockGetUser = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser
    }
  })
}));

// Mock do NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn().mockReturnValue({ status: 200 }),
    redirect: jest.fn().mockImplementation((url) => ({ 
      status: 307, 
      url: url.toString(),
      cookies: {
        delete: jest.fn()
      }
    })),
  },
}));

describe('Proxy Admin Auth', () => {
  const createMockRequest = (path: string, cookieValue?: string) => ({
    nextUrl: { pathname: path },
    url: `http://localhost${path}`,
    cookies: {
      get: jest.fn((name) => name === 'sb-access-token' && cookieValue ? { value: cookieValue } : undefined),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve redirecionar se não autorizado em rota admin', async () => {
    const req = createMockRequest('/admin/convidados') as any;
    const res = await proxy(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res?.status).toBe(307);
  });

  test('deve permitir acesso se token for válido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    const req = createMockRequest('/admin/convidados', 'valid-token') as any;
    const res = await proxy(req);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(res?.status).toBe(200);
  });
});
