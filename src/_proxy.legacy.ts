import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Evitar processamento para arquivos estáticos, api e favicon
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

  // 2. Proteção das rotas ADMIN
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
  // Se for uma rota de convite /inv/[slug], verificamos se o evento correspondente está ativo
  if (pathname.startsWith('/inv/')) {
    const slug = pathname.split('/')[2];
    
    if (slug) {
      // Buscamos o convite pelo slug e fazemos join com o evento
      const { data: invite } = await supabase
        .from('convites')
        .select('evento_id, eventos(is_active)')
        .eq('slug', slug)
        .single();

      // Se o convite existir e o evento não estiver ativo (is_active = false)
      if (invite && invite.eventos) {
        // Se is_active for null ou undefined, consideramos inativo também, mas vamos usar um default seguro
        const isActive = (invite.eventos as any).is_active === true;
        if (!isActive) {
          // Bloqueamos geral para convidados se o site não foi ativado
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
