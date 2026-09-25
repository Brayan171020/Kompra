import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const tokenNames = ['neon_auth_session_token', 'neon-auth-session-token', 'session_token', 'token'];
  const tokenName = tokenNames.find((name) => request.nextUrl.searchParams.get(name));
  const token = tokenName ? request.nextUrl.searchParams.get(tokenName) : null;

  if (token) {
    const returnTo = request.nextUrl.clone();
    for (const name of tokenNames) returnTo.searchParams.delete(name);
    // The OAuth callback has already set Neon's signed session cookie through
    // the auth proxy. Keep that cookie and only remove the token from the URL.
    return NextResponse.redirect(new URL(`${returnTo.pathname}${returnTo.search}${returnTo.hash}`, request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
