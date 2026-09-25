import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL?.replace(/\/$/, '');

export const authClient = createAuthClient({
  baseURL: neonAuthUrl ?? `${apiBaseUrl}/api/v1/auth`,
  plugins: [magicLinkClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
