import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

/**
 * Cria um cliente Supabase robusto para uso em API Routes ou Server Components.
 */
export const getSupabaseServerClient = async (req?: { headers: { get: (name: string) => string | null } }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const cookieStore = await cookies();
  const headerStore = req?.headers || (await headers());
  
  // Tenta obter o token do Header Authorization (Bearer ...)
  const authHeader = headerStore.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Se não estiver no header, tenta no cookie customizado
  if (!token) {
    const sessionCookie = cookieStore.get('sb-access-token');
    if (sessionCookie?.value) {
      token = sessionCookie.value;
    }
  }
  
  const options: { auth: { persistSession: boolean }; global?: { headers: { Authorization: string } } } = {
    auth: { persistSession: false }
  };

  if (token) {
    console.log('[getSupabaseServerClient] Sessão recuperada (Header ou Cookie).');
    options.global = {
      headers: { Authorization: `Bearer ${token}` }
    };
  } else {
    console.warn('[getSupabaseServerClient] Nenhuma sessão detectada. Operando como Anon.');
  }
  
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, options);
}
