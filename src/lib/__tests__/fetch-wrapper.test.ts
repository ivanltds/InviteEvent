import { fetchWithRetry } from '../fetch-wrapper';

describe('fetchWithRetry (TDD - Fase RED)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('deve realizar uma requisição bem-sucedida de primeira', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'success' }),
    });

    const result = await fetchWithRetry('/api/test');
    const data = await result.json();

    expect(data.data).toBe('success');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('deve tentar novamente em caso de erro 500', async () => {
    // Falha 2 vezes e acerta na 3ª
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: 'recovered' }) });

    const result = await fetchWithRetry('/api/test', { 
      retries: 3, 
      minTimeout: 10 // timeout pequeno para o teste ser rápido 
    });
    const data = await result.json();

    expect(data.data).toBe('recovered');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('deve falhar definitivamente após exceder o número de tentativas', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchWithRetry('/api/test', { retries: 2, minTimeout: 10 }))
      .rejects.toThrow('Max retries exceeded for /api/test');
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('deve respeitar o Exponential Backoff (tempo crescente)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    const startTime = Date.now();
    try {
      await fetchWithRetry('/api/test', { 
        retries: 3, 
        minTimeout: 100, // 100ms inicial
        factor: 2 // dobra o tempo a cada erro
      });
    } catch (e) {
      // Ignora erro, queremos medir o tempo
    }
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Tentativa 1: imediata
    // Tentativa 2: +100ms
    // Tentativa 3: +200ms
    // Total esperado aproximado: ~300ms+
    expect(duration).toBeGreaterThanOrEqual(300);
  });
});
