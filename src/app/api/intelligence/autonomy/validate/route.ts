import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ valid: false, error: 'URL ausente' }, { status: 400 });
  }

  // 1. Normalização de Protocolo (Se vier 'www.test.com', vira 'https://www.test.com')
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // 2. Validação Estrutural (Impede erros de parse no Node fetch)
  try {
    new URL(normalizedUrl);
  } catch (err) {
    console.warn('[PreFlight Link Guard] URL estruturalmente inválida detectada:', normalizedUrl);
    return NextResponse.json({
      valid: false,
      status: 'MALFORMED_URL',
      message: 'A URL inserida não é semanticamente válida.'
    });
  }

  try {
    // Define um controller de aborto para timeout rígido de 3.0 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(normalizedUrl, {
      method: 'GET', // GET é mais aceito em proxies de afiliados do que HEAD
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    // 404 (Not Found) e 410 (Gone) indicam inequivocamente que o link quebrou permanentemente.
    // 403 e 503 em e-commerce geralmente são bots sendo bloqueados pela Cloudflare do parceiro,
    // então consideramos VÁLIDO (fail-safe) para não barrar o usuário injustamente.
    if (response.status === 404 || response.status === 410) {
      return NextResponse.json({ 
        valid: false, 
        status: response.status,
        message: 'O parceiro retornou uma página inexistente.'
      });
    }

    return NextResponse.json({ 
      valid: true, 
      status: response.status 
    });

  } catch (error: any) {
    console.error('[PreFlight Link Guard] Erro de validação para URL:', normalizedUrl, error.message);

    // Se foi um erro de DNS (domínio inexistente) ou Timeout crítico, consideramos quebrado!
    if (
      error.name === 'AbortError' || 
      error.message?.includes('ENOTFOUND') || 
      error.message?.includes('fetch failed') ||
      error.message?.includes('Failed to parse URL')
    ) {
      return NextResponse.json({ 
        valid: false, 
        status: 'DNS_OR_TIMEOUT',
        message: 'Domínio não responde ou excedeu tempo de espera.'
      });
    }

    // Para qualquer outro erro misterioso (SSL expirado, etc), assumimos VÁLIDO como rede de segurança.
    return NextResponse.json({ 
      valid: true, 
      status: 'BYPASS_ON_ERROR' 
    });
  }
}
