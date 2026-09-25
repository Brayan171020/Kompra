import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const tokenNames = ['neon_auth_session_token', 'neon-auth-session-token', 'session_token', 'token'];
  const tokenName = tokenNames.find((name) => request.nextUrl.searchParams.get(name));
  const token = tokenName ? request.nextUrl.searchParams.get(tokenName) : null;

  if (token) {
    const callback = new URL('/api/auth/callback/neon', request.url);
    const returnTo = request.nextUrl.clone();
    for (const name of tokenNames) returnTo.searchParams.delete(name);
    callback.searchParams.set('token', token);
    callback.searchParams.set('returnTo', `${returnTo.pathname}${returnTo.search}${returnTo.hash}`);
    return NextResponse.redirect(callback);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
