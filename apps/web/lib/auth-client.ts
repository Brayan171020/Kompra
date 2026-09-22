import { createAuthClient } from 'better-auth/react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/api/v1/auth`,
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => (typeof window === 'undefined' ? '' : window.localStorage.getItem('kompra_bearer_token') ?? ''),
    },
    onSuccess: (context) => {
      const token = context.response.headers.get('set-auth-token');
      if (token && typeof window !== 'undefined') window.localStorage.setItem('kompra_bearer_token', token);
    },
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
