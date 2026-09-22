import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('better-auth.session_token') || request.cookies.has('__Secure-better-auth.session_token');
  if (!hasSession) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
