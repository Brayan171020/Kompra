import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const authProxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : 'http://localhost:3000/api/auth';

export const authClient = createAuthClient({
  // Same-origin proxy: it prevents Neon Auth cookies from becoming third-party cookies.
  baseURL: authProxyUrl,
  plugins: [magicLinkClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
