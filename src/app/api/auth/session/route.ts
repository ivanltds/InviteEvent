import { NextResponse } from 'next/server';

/**
 * API Route para sincronizar a sessão do Supabase com cookies HTTP-only.
 * Isso permite que o Middleware valide a sessão de forma segura.
 */
export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    // Define o token do Supabase em um cookie seguro
    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 dia
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('sb-access-token');
  return response;
}
