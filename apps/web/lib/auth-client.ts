import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const authProxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : 'http://localhost:3000/api/auth';

let bootstrapSessionToken: string | null = null;

export function setBootstrapSessionToken(token: string | null): void {
  bootstrapSessionToken = token;
}

export function getBootstrapSessionToken(): string | null {
  return bootstrapSessionToken;
}

export const authClient = createAuthClient({
  // Same-origin proxy: it prevents Neon Auth cookies from becoming third-party cookies.
  baseURL: authProxyUrl,
  plugins: [magicLinkClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export type AuthSessionData = Awaited<ReturnType<typeof authClient.getSession>>['data'];

export async function getSessionFromUrlToken(token: string): Promise<{ data: AuthSessionData | null; error?: unknown }> {
  setBootstrapSessionToken(token);
  const response = await fetch('/api/auth/callback/neon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include',
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as { data?: AuthSessionData | null; error?: unknown } | AuthSessionData | null;
  const neonSession = response.ok
    ? payload && typeof payload === 'object' && 'data' in payload
      ? payload.data ?? null
      : payload as AuthSessionData | null
    : null;
  const refreshed = await authClient.getSession({ query: { disableCookieCache: true } }).catch(() => null);
  if (refreshed?.data) {
    setBootstrapSessionToken(null);
    return { data: refreshed.data };
  }
  if (neonSession) return { data: neonSession };

  // Neon Auth's managed get-session endpoint may not accept bearer tokens.
  // Validate the opaque token through the API's Neon DB-backed AuthGuard so
  // the OAuth redirect can still bootstrap the app without fabricating a cookie.
  try {
    const identityResponse = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      cache: 'no-store',
    });
    const identity = await identityResponse.json().catch(() => null) as {
      user?: AuthSessionData extends { user: infer T } ? T : never;
    } | null;
    if (identityResponse.ok && identity?.user) {
      return {
        data: { user: identity.user, session: { token } } as unknown as AuthSessionData,
      };
    }
    setBootstrapSessionToken(null);
    return { data: null, error: { status: identityResponse.status, payload: identity } };
  } catch (error) {
    setBootstrapSessionToken(null);
    return { data: null, error };
  }
}

export const { useSession, signIn, signUp, signOut } = authClient;
