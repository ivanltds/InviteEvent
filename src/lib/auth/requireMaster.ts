import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Guarda de autorização para rotas internas (admin/suporte/intelligence).
 *
 * Adicionada em 20/09/2026 (docs/analise/01-seguranca.md, SEG-08/09/10):
 * essas rotas confiavam só na interface para esconder botões de quem não
 * era master, mas o servidor nunca checava nada — qualquer requisição HTTP
 * direta, sem login nenhum, conseguia ler e escrever nos dados internos.
 *
 * Reaproveita a função `check_is_master()` do banco (a mesma fonte de
 * verdade usada pelo RLS), então não depende de nenhuma variável de
 * ambiente nova nem de SUPABASE_SERVICE_ROLE_KEY.
 */
export async function requireMaster(
  req?: { headers: { get: (name: string) => string | null } }
): Promise<
  | { authorized: true; supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>; userId: string }
  | { authorized: false; response: NextResponse }
> {
  const supabase = await getSupabaseServerClient(req);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Não autenticado.' },
        { status: 401 }
      ),
    };
  }

  const { data: isMaster, error: masterError } = await supabase.rpc('check_is_master');
  if (masterError || !isMaster) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Acesso restrito a administradores.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, supabase, userId: userData.user.id };
}
