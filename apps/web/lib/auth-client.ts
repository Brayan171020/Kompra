'use client';

import { createAuthClient } from '@neondatabase/auth/next';

// The Neon adapter uses the same-origin /api/auth proxy configured by the
// server integration. It also completes Neon OAuth verifier callbacks.
export const authClient = createAuthClient();
export const { useSession, signIn, signUp, signOut } = authClient;

export type AuthSessionData = Awaited<ReturnType<typeof authClient.getSession>>['data'];
