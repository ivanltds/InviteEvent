import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import net from 'net';

const { promises: dnsPromises } = dns;

/**
 * Bloqueio de SSRF (docs/analise/01-seguranca.md, SEG-08): esta rota é
 * pública de propósito (o convidado usa ela para checar o link de um
 * presente antes de comprar), então a defesa não pode ser "exigir login" —
 * tem que ser "não deixar o servidor buscar endereços internos". Resolve o
 * hostname e recusa qualquer IP privado/loopback/link-local, além de
 * metadata endpoints de nuvem (169.254.169.254) antes de fazer o fetch.
 */
function isBlockedIp(ip: string): boolean {
  if (net.isIP(ip) === 0) return true; // não é IP válido, bloqueia por segurança

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // RFC1918
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 169 && b === 254) return true; // link-local + metadata de nuvem
    if (a === 0) return true; // "essa rede"
    if (a >= 224) return true; // multicast/reservado
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  if (lower === '::1') return true; // loopback
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('::ffff:')) {
    // IPv4-mapped: reaplica a checagem de IPv4
    return isBlockedIp(lower.replace('::ffff:', ''));
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const results = await dnsPromises.lookup(hostname, { all: true });
  if (results.length === 0) {
    throw new Error('DNS_NO_RESULT');
  }
  for (const { address } of results) {
    if (isBlockedIp(address)) {
      throw new Error('BLOCKED_PRIVATE_ADDRESS');
    }
  }
}

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
  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch (err) {
    console.warn('[PreFlight Link Guard] URL estruturalmente inválida detectada:', normalizedUrl);
    return NextResponse.json({
      valid: false,
      status: 'MALFORMED_URL',
      message: 'A URL inserida não é semanticamente válida.'
    });
  }

  // 2b. Só http/https, e só hosts públicos (bloqueia SSRF para rede interna,
  // localhost e metadata de nuvem).
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({
      valid: false,
      status: 'BLOCKED_PROTOCOL',
      message: 'Apenas links http/https são aceitos.'
    });
  }

  try {
    await assertPublicHost(parsed.hostname);
  } catch (err) {
    console.warn('[PreFlight Link Guard] Host bloqueado (SSRF):', parsed.hostname, err);
    return NextResponse.json({
      valid: false,
      status: 'BLOCKED_HOST',
      message: 'Este endereço não pode ser validado.'
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
