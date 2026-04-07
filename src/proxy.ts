import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Log para depuração de redirecionamento (ajuda a ver o "hang")
  console.log(`[Proxy] Path: ${pathname}`);

  // Evitar redirecionamento para arquivos estáticos, api e favicon
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Proteção das rotas ADMIN (exceto a página de login /admin)
  // Usamos regex ou verificações precisas para evitar loop de trailing slash
  if (pathname.startsWith('/admin')) {
    // Se o path for EXATAMENTE /admin ou /admin/, não redireciona (é a tela de login)
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.next();
    }

    const authCookie = request.cookies.get('admin-auth')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@'

    if (!authCookie || authCookie.value !== adminPassword) {
      console.log(`[Proxy] Não autorizado em ${pathname}, redirecionando para /admin`);
      const loginUrl = new URL('/admin', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" abaixo para aprender mais
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
