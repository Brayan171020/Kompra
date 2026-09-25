import { NextRequest, NextResponse } from 'next/server';

const neonAuthUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL
  ?? 'https://ep-fancy-star-b5njfgl0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth').replace(/\/$/, '');
const sessionCookieName = process.env.NEON_AUTH_SESSION_COOKIE ?? '__Secure-neon-auth.session_token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');
  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  if (!token) return NextResponse.redirect(new URL('/login?error=missing_session_token', request.url));

  // Validate before creating a first-party cookie. The token is never logged.
  const validation = await fetch(`${neonAuthUrl}/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    cache: 'no-store',
  });
  const payload = await validation.json().catch(() => null);
  if (!validation.ok || !payload) return NextResponse.redirect(new URL('/login?error=invalid_session', request.url));

  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set({
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}

/** Exchange a callback token for a same-origin, first-party session cookie. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token) return NextResponse.json({ message: 'A session token is required' }, { status: 400 });

  const validation = await fetch(`${neonAuthUrl}/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const payload = await validation.json().catch(() => null);
  if (!validation.ok || !payload) {
    return NextResponse.json({ message: 'The session token is invalid or expired' }, { status: 401 });
  }

  const response = NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set({
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
  });
  return response;
}

function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/app')) return '/app';
  return value;
}
