import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validação de ambiente para avisar o desenvolvedor mas não quebrar o runtime
const isConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('sua_url_do_supabase'));

if (!isConfigured && typeof window !== 'undefined') {
  console.warn(
    '⚠️ Supabase não configurado ou usando valores padrão. Adicione chaves reais no seu arquivo .env.'
  );
}

/**
 * Cria um Proxy infinitamente encadeável que não quebra o runtime
 * em caso de falta de chaves no ambiente.
 * Versão robusta para Next.js 15+ (compatível com Server Components e Client Components).
 */
function createProxy() {
  const silentFail: any = () => silentFail;
  
  const proxyHandler: ProxyHandler<any> = {
    get: (target, prop) => {
      // Quando o código tenta dar 'await' ou chamar .then()
      if (prop === 'then') {
        return (onFulfilled: any) => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }).then(onFulfilled);
      }
      if (prop === 'catch') {
        return (onRejected: any) => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }).catch(onRejected);
      }
      if (prop === 'finally') {
        return (onFinally: any) => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }).finally(onFinally);
      }
      
      // Propriedades do motor JS que devem retornar valores seguros
      if (typeof prop === 'symbol' || prop === 'constructor' || prop === 'inspect' || prop === 'toJSON') {
        return undefined;
      }

      // Retorna um novo Proxy para permitir encadeamento infinito
      return new Proxy(silentFail, proxyHandler);
    },
    // Retorna um novo Proxy quando o objeto é chamado como função: supabase.from('tabela')
    apply: () => new Proxy(silentFail, proxyHandler)
  };

  return new Proxy(silentFail, proxyHandler);
}

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createProxy();
