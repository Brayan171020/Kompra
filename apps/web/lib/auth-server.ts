import { createNeonAuth } from '@neondatabase/auth/next/server';

let auth: ReturnType<typeof createNeonAuth> | undefined;

export function getNeonAuth() {
  if (auth) return auth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL
    ?? process.env.NEON_AUTH_URL
    ?? process.env.NEXT_PUBLIC_NEON_AUTH_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (!baseUrl) throw new Error('NEON_AUTH_BASE_URL must be configured.');
  if (!secret || secret.length < 32) {
    throw new Error('NEON_AUTH_COOKIE_SECRET must be configured with at least 32 characters.');
  }

  auth = createNeonAuth({ baseUrl, cookies: { secret, sameSite: 'lax' } });
  return auth;
}
