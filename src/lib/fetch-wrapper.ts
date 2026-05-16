/**
 * Utilitário de fetch com suporte a re-tentativas automáticas e Exponential Backoff.
 * Projetado para suportar picos de carga e falhas temporárias de rede/servidor.
 */

interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  factor?: number;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit & RetryOptions
): Promise<Response> {
  const { 
    retries = 3, 
    minTimeout = 500, 
    factor = 2, 
    ...fetchInit 
  } = init || {};

  let lastError: Error | undefined;
  let currentDelay = minTimeout;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(input, fetchInit);

      // Só tenta novamente em caso de erros de servidor (5xx)
      // Erros 4xx (como 401, 403, 404) são considerados erros lógicos e não devem ser re-tentados.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Se chegamos aqui, é um erro 5xx. Prepara para o próximo loop ou falha definitiva.
      lastError = new Error(`HTTP Error: ${response.status} for ${input.toString()}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Se ainda restam tentativas, aguarda o tempo de backoff
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= factor;
    }
  }

  throw new Error(`Max retries exceeded for ${input.toString()}. Last error: ${lastError?.message}`);
}
