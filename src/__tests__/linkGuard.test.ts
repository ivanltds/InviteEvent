jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

import { GET } from '../app/api/intelligence/autonomy/validate/route';

// Salva referência original do fetch
const originalFetch = global.fetch;

describe('Pre-Flight Link Guard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
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
    (global.fetch as jest.Mock).mockRejectedValue(new Error('fetch failed (ENOTFOUND)'));

    const req = createMockRequest('https://dominio-que-nao-existe.com');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.status).toBe('DNS_OR_TIMEOUT');
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
