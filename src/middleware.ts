import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if we are in an admin route
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.endsWith('/admin')) {
    const authCookie = request.cookies.get('admin-auth')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '3781l@m@'

    if (authCookie?.value !== adminPassword) {
      // Redirect to login page if not authenticated
      const loginUrl = new URL('/admin', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
}
