import { NextRequest, NextResponse } from 'next/server';

const neonAuthUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL
  ?? 'https://ep-fancy-star-b5njfgl0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest): Promise<NextResponse> {
  const upstreamBase = neonAuthUrl;
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\/?/, '');
  const upstreamUrl = `${upstreamBase}/${path}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  // Do not leak Next/Vercel routing metadata to Neon Auth. In particular,
  // x-forwarded-host can make the managed endpoint reject an otherwise valid
  // get-session request as a malformed origin.
  for (const header of ['x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'next-url', 'rsc', 'next-router-state-tree', 'next-router-prefetch']) {
    headers.delete(header);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('set-cookie');

  const location = upstream.headers.get('location');
  if (location) responseHeaders.set('location', rewriteOAuthCallback(location, request, upstreamBase));

  for (const cookie of getSetCookies(upstream.headers)) {
    // The browser must store the cookie for Vercel, never for neon.tech.
    responseHeaders.append('set-cookie', cookie.replace(/;\s*Domain=[^;]+/gi, ''));
  }

  let responseBody: BodyInit | null = upstream.body;
  if (path === 'sign-in/social' && upstream.headers.get('content-type')?.includes('application/json')) {
    const payload = await upstream.json() as { url?: string; redirect?: boolean; [key: string]: unknown };
    if (payload.url) payload.url = rewriteOAuthCallback(payload.url, request, upstreamBase);
    responseBody = JSON.stringify(payload);
    responseHeaders.set('content-type', 'application/json');
  }

  return new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

function rewriteOAuthCallback(location: string, request: NextRequest, upstreamBase: string): string {
  try {
    const redirect = new URL(location);
    const callback = redirect.searchParams.get('redirect_uri');
    if (callback?.startsWith(`${upstreamBase}/`)) {
      const upstreamPath = new URL(upstreamBase).pathname.replace(/\/$/, '');
      const callbackPath = new URL(callback).pathname.slice(upstreamPath.length).replace(/^\/+/, '');
      redirect.searchParams.set('redirect_uri', `${request.nextUrl.origin}/api/auth/${callbackPath}`);
      return redirect.toString();
    }
  } catch {
    // Preserve non-URL redirect headers unchanged.
  }
  return location;
}

function getSetCookies(headers: Headers): string[] {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (getSetCookie) return getSetCookie.call(headers);
  const cookie = headers.get('set-cookie');
  return cookie ? [cookie] : [];
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
