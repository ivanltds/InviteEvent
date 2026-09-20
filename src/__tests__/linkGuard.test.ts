jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

// A rota agora resolve o hostname antes de buscar (bloqueio de SSRF —
// docs/analise/01-seguranca.md, SEG-08). Mockamos a resolução de DNS para
// que os domínios fictícios dos testes se comportem como um host público
// normal, sem depender de rede real no ambiente de CI.
jest.mock('dns', () => ({
  promises: { lookup: jest.fn() }
}));

import dns from 'dns';
import { GET } from '../app/api/intelligence/autonomy/validate/route';

const mockLookup = dns.promises.lookup as jest.Mock;
const PUBLIC_IP = '93.184.216.34'; // IP público de exemplo (example.com)

// Salva referência original do fetch
const originalFetch = global.fetch;

describe('Pre-Flight Link Guard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Por padrão, todo hostname resolve para um IP público válido.
    mockLookup.mockResolvedValue([{ address: PUBLIC_IP, family: 4 }]);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const createMockRequest = (urlParam: string | null) => {
    const urlStr = urlParam 
      ? `http://localhost/api/intelligence/autonomy/validate?url=${encodeURIComponent(urlParam)}`
      : 'http://localhost/api/intelligence/autonomy/validate';
    
    const nextUrl = new URL(urlStr);
    
    return {
      nextUrl,
      url: urlStr
    } as any;
  };

  it('deve retornar erro 400 se a URL estiver ausente', async () => {
    const req = createMockRequest(null);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('URL ausente');
  });

  it('deve declarar o link como VALIDO se o parceiro retornar 200 OK', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true
    });

    const req = createMockRequest('https://loja-parceira.com/item-ok');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.status).toBe(200);
  });

  it('deve declarar o link como INVALIDO se o parceiro retornar 404 Not Found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false
    });

    const req = createMockRequest('https://loja-parceira.com/item-morto');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200); // Retorna payload normal para consumo client-side
    expect(data.valid).toBe(false);
    expect(data.status).toBe(404);
  });

  it('deve tratar erro de DNS (ENOTFOUND) declarando o link como INVALIDO', async () => {
    // Agora a resolução de DNS falha ANTES do fetch (checagem de SSRF),
    // então o motivo vira BLOCKED_HOST em vez de chegar ao fetch mockado —
    // o resultado para o convidado continua sendo "link inválido".
    mockLookup.mockRejectedValue(Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' }));

    const req = createMockRequest('https://dominio-que-nao-existe.com');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.status).toBe('BLOCKED_HOST');
  });

  it('deve bloquear (SSRF) um link que resolve para um IP privado/interno', async () => {
    mockLookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]); // metadata de nuvem

    const req = createMockRequest('https://link-malicioso.com');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.status).toBe('BLOCKED_HOST');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve tratar erros genericos (fail-safe) declarando o link como VALIDO para nao barrar o usuario', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('SSL expired or unknown system error'));

    const req = createMockRequest('https://loja-parceira.com/item-estranho');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.status).toBe('BYPASS_ON_ERROR');
  });

  it('deve tentar autocorrigir URLs sem protocolo e declarar valido se o ping passar', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true
    });

    const req = createMockRequest('www.parceiro.com/item-sem-protocolo');
    const response = await GET(req);
    const data = await response.json();

    // O mock deve ter recebido 'https://www.parceiro.com/item-sem-protocolo'
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.parceiro.com/'),
      expect.any(Object)
    );
    expect(data.valid).toBe(true);
  });

  it('deve declarar INVALIDO se a URL for estruturalmente invalida mesmo apos normalizacao', async () => {
    const req = createMockRequest('://invalid-structure');
    const response = await GET(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.status).toBe('MALFORMED_URL');
  });
});
