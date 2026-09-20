// Testes da correção de 20/09/2026 (docs/analise/01-seguranca.md;
// docs/analise/03-testes.md, TST-02): antes desta correção, a rota de
// checkout ativava a licença do evento de graça, sem pagamento nenhum,
// sempre que STRIPE_SECRET_KEY não estivesse configurada — exatamente o
// estado da Vercel de produção. Estes testes travam esse comportamento.

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mocks "vazios" e auto-contidos no factory (sem referenciar variáveis de
// fora) — a instância do Stripe é criada no topo de route.ts, no momento em
// que o módulo é importado, então qualquer variável externa referenciada
// aqui ainda estaria em temporal dead zone. A configuração real de cada
// mock acontece no beforeEach, depois que o módulo já foi carregado.
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// route.ts cria `new Stripe(...)` uma única vez, no topo do módulo, na
// primeira importação — então o mock de create precisa ser uma referência
// ESTÁVEL exposta pelo próprio factory (senão um mockImplementation setado
// depois, em beforeEach, chega tarde demais para esse singleton).
jest.mock('stripe', () => {
  const mockSessionsCreate = jest.fn();
  const MockStripe: any = jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockSessionsCreate } },
  }));
  MockStripe.__mockSessionsCreate = mockSessionsCreate;
  return MockStripe;
});

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { POST } from '../route';

const mockGetUser = jest.fn();
const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockSessionsCreate = (Stripe as any).__mockSessionsCreate as jest.Mock;

const AUTHENTICATED_USER = { id: 'user-1', email: 'noivo@example.com' };

function mockAuthenticatedRequest() {
  (cookies as jest.Mock).mockResolvedValue({
    get: (name: string) => (name === 'sb-access-token' ? { value: 'valid-token' } : undefined),
  });
  mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
}

function makeRequest(body: any) {
  return { json: async () => body } as Request;
}

describe('POST /api/checkout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.ALLOW_MOCK_CHECKOUT;
    (process.env as any).NODE_ENV = 'production';

    (createClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
      from: mockFrom,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('recusa (401) quando não há sessão', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });

    const res: any = await POST(makeRequest({ eventoId: 'evt-1' }));

    expect(res.status).toBe(401);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it('recusa (403) quando o usuário não é organizador do evento', async () => {
    mockAuthenticatedRequest();
    mockRpc.mockResolvedValue({ data: false });

    const res: any = await POST(makeRequest({ eventoId: 'evento-de-outro-casal' }));

    expect(res.status).toBe(403);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it('NUNCA ativa o evento de graça quando STRIPE_SECRET_KEY está ausente em produção (regressão do bug crítico)', async () => {
    mockAuthenticatedRequest();
    mockRpc.mockResolvedValue({ data: true });
    // STRIPE_SECRET_KEY ausente e NODE_ENV=production (cenário real da Vercel hoje)

    const res: any = await POST(makeRequest({ eventoId: 'evt-1' }));
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(mockFrom).not.toHaveBeenCalledWith('eventos');
    expect(data.url).toBeUndefined();
  });

  it('não ativa de graça mesmo com ALLOW_MOCK_CHECKOUT=true, se estiver em produção', async () => {
    mockAuthenticatedRequest();
    mockRpc.mockResolvedValue({ data: true });
    process.env.ALLOW_MOCK_CHECKOUT = 'true';
    (process.env as any).NODE_ENV = 'production';

    const res: any = await POST(makeRequest({ eventoId: 'evt-1' }));

    expect(res.status).toBe(503);
    expect(mockFrom).not.toHaveBeenCalledWith('eventos');
  });

  it('permite o modo mock apenas fora de produção com a flag explícita', async () => {
    mockAuthenticatedRequest();
    mockRpc.mockResolvedValue({ data: true });
    (process.env as any).NODE_ENV = 'development';
    process.env.ALLOW_MOCK_CHECKOUT = 'true';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
    const mockUpdate = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }));
    mockFrom.mockReturnValue({ update: mockUpdate });

    const res: any = await POST(makeRequest({ eventoId: 'evt-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toContain('mock=true');
  });

  it('cria uma sessão real do Stripe quando a chave está configurada', async () => {
    mockAuthenticatedRequest();
    mockRpc.mockResolvedValue({ data: true });
    process.env.STRIPE_SECRET_KEY = 'sk_test_valid';
    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session-123' });

    const res: any = await POST(makeRequest({ eventoId: 'evt-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/session-123');
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ eventoId: 'evt-1', userId: 'user-1' }),
      })
    );
  });
});
