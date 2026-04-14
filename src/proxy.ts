import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * STORY-049/STORY-055: Proxy de Proteção de Rotas
 * 
 * Protege todas as rotas /admin/* e implementa a Barreira de Ativação para /inv/[slug].
 * Next.js 16 (2026) depreciou 'middleware.ts' em favor de 'proxy.ts' e função 'proxy()'.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Passthrough para assets estáticos, api e favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // 2. Proteção das rotas ADMIN — exige sessão ativa
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const accessToken = request.cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('sb-access-token');
      return response;
    }
  }

  // 3. BARREIRA DE ATIVAÇÃO (STORY-043)
  // Verifica se o evento do convite está ativo antes de servir /inv/[slug]
  if (pathname.startsWith('/inv/')) {
    const slug = pathname.split('/')[2];

    if (slug) {
      const { data: invite } = await supabase
        .from('convites')
        .select('evento_id, eventos(is_active)')
        .eq('slug', slug)
        .single();

      if (invite && invite.eventos) {
        const isActive = (invite.eventos as any).is_active === true;
        if (!isActive) {
          return NextResponse.rewrite(new URL('/manutencao', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/inv/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
