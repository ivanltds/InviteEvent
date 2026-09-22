import { POST, GET } from '../route';
import { LandingChatService } from '@/lib/services/landingChatService';
import { getSupabaseServerClient } from '@/lib/supabase-server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock('@/lib/services/landingChatService', () => ({
  LandingChatService: { processMessage: jest.fn() },
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request;
}

/** O mock de NextResponse.json devolve {data, status} puro — este tipo cobre o formato usado nos testes abaixo. */
interface MockJsonResponse {
  data: { success: boolean; response?: string; error?: string; messages?: unknown[] };
  status: number;
}

function asMockResponse(value: unknown): MockJsonResponse {
  return value as MockJsonResponse;
}

describe('POST /api/landing-chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejeita requisição sem sessionId', async () => {
    const res = asMockResponse(await POST(makeRequest({ message: 'oi' })));
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  it('rejeita requisição sem message', async () => {
    const res = asMockResponse(await POST(makeRequest({ sessionId: 's1' })));
    expect(res.status).toBe(400);
  });

  it('rejeita mensagem vazia (só espaços)', async () => {
    const res = asMockResponse(await POST(makeRequest({ sessionId: 's1', message: '   ' })));
    expect(res.status).toBe(400);
  });

  it('rejeita mensagem acima do limite de tamanho', async () => {
    const res = asMockResponse(await POST(makeRequest({ sessionId: 's1', message: 'a'.repeat(2001) })));
    expect(res.status).toBe(400);
  });

  it('processa a mensagem e retorna a resposta do assistente', async () => {
    (LandingChatService.processMessage as jest.Mock).mockResolvedValue({ response: 'Oi! Como posso ajudar?', leadId: 'lead-1' });

    const res = asMockResponse(await POST(makeRequest({ sessionId: 's1', message: 'Quero saber mais' })));

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true, response: 'Oi! Como posso ajudar?' });
    expect(LandingChatService.processMessage).toHaveBeenCalledWith('s1', 'Quero saber mais', undefined);
  });

  it('retorna 500 amigável se o serviço lançar erro', async () => {
    (LandingChatService.processMessage as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = asMockResponse(await POST(makeRequest({ sessionId: 's1', message: 'oi' })));

    expect(res.status).toBe(500);
    expect(res.data.success).toBe(false);
  });
});

describe('GET /api/landing-chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeGetRequest(sessionId: string | null): Request {
    const url = sessionId ? `https://x.com/api/landing-chat?sessionId=${sessionId}` : 'https://x.com/api/landing-chat';
    return { url } as unknown as Request;
  }

  it('exige sessionId', async () => {
    const res = asMockResponse(await GET(makeGetRequest(null)));
    expect(res.status).toBe(400);
  });

  it('retorna lista vazia quando a sessão não tem lead criado ainda', async () => {
    (getSupabaseServerClient as jest.Mock).mockResolvedValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      })),
    });

    const res = asMockResponse(await GET(makeGetRequest('sem-lead')));
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true, messages: [] });
  });

  it('retorna o histórico de mensagens do lead da sessão', async () => {
    const mensagens = [{ role: 'user', conteudo: 'oi', created_at: '2026-01-01' }];
    (getSupabaseServerClient as jest.Mock).mockResolvedValue({
      from: jest.fn((table: string) => {
        if (table === 'landing_leads') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'lead-1' } }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mensagens, error: null }),
        };
      }),
    });

    const res = asMockResponse(await GET(makeGetRequest('com-lead')));
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true, messages: mensagens });
  });
});
