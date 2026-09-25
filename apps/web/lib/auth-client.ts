import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL?.replace(/\/$/, '');

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/api/v1/auth`,
  plugins: [magicLinkClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

// Neon Auth owns Google OAuth when Shared Keys are enabled. Keep email/password
// and the API session on the NestJS proxy, but send social OAuth to Neon.
export const neonAuthClient = neonAuthUrl ? createAuthClient({
  baseURL: neonAuthUrl,
  fetchOptions: { credentials: 'include' },
}) : authClient;

export const { useSession, signIn, signUp, signOut } = authClient;
