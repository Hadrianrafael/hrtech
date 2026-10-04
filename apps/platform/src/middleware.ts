import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proteção de rotas (camada 1): exige cookie de sessão nas áreas autenticadas.
 * A validação real da sessão, organização e permissões acontece no servidor
 * (layouts, server actions e route handlers) — nunca apenas aqui ou no frontend.
 */
const PUBLIC_PREFIXES = ['/login', '/forgot-password', '/reset-password', '/accept-invite', '/api/', '/widget.js', '/embed-demo', '/_next', '/favicon'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.get('hrt_session')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname !== '/dashboard' ? `?next=${encodeURIComponent(pathname)}` : '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|svg|ico|jpg|webp)$).*)'] };
