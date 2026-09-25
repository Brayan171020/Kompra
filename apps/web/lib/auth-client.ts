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
  const response = await fetch(`${authProxyUrl}/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  const payload = await response.json().catch(() => null) as { data?: AuthSessionData | null; error?: unknown } | AuthSessionData | null;
  if (!response.ok) return { data: null, error: payload };
  if (payload && typeof payload === 'object' && 'data' in payload) return { data: payload.data ?? null };
  return { data: payload as AuthSessionData | null };
}

export const { useSession, signIn, signUp, signOut } = authClient;
