import { NextRequest, NextResponse } from 'next/server';

const neonAuthUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL
  ?? 'https://ep-fancy-star-b5njfgl0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');
  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  if (!token) return NextResponse.redirect(new URL('/login?error=missing_session_token', request.url));

  // Do not turn the URL token into a cookie: Neon emits the signed cookie on
  // its proxied OAuth callback. This legacy endpoint only removes the token.
  const destination = new URL(returnTo, request.url);
  for (const name of ['neon_auth_session_token', 'neon-auth-session-token', 'session_token', 'token']) {
    destination.searchParams.delete(name);
  }
  return NextResponse.redirect(destination);
}

/** Validate a URL session token when the client needs an in-memory bootstrap. */
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

  // The opaque URL token cannot be used as a Better Auth cookie value. The
  // signed cookie must come from Neon through the transparent auth proxy.
  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
}

function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/app')) return '/app';
  return value;
}
