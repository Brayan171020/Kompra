'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, getSessionFromUrlToken } from '../../lib/auth-client';
import { FriendNetwork } from '../../components/friend-network';
import { CategoryQuickCreate } from '../../components/category-quick-create';
import { ListAssignmentQuick } from '../../components/list-assignment-quick';
import { apiFetch } from '../../lib/api';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, isPending, error } = authClient.useSession();
  const router = useRouter();
  const [urlSession, setUrlSession] = useState<typeof session>(null);
  const [sessionParamPending, setSessionParamPending] = useState(true);
  const [identityReady, setIdentityReady] = useState(false);
  const [identityError, setIdentityError] = useState('');
  const effectiveSession = session ?? urlSession;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = ['neon_auth_session_token', 'neon-auth-session-token', 'session_token', 'token']
      .map((name) => params.get(name))
      .find((value): value is string => Boolean(value));

    if (!tokenParam) {
      setSessionParamPending(false);
      return;
    }

    let cancelled = false;
    getSessionFromUrlToken(tokenParam)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setUrlSession(data);
          for (const name of ['neon_auth_session_token', 'neon-auth-session-token', 'session_token', 'token']) params.delete(name);
          const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
          window.history.replaceState(window.history.state, '', cleanUrl);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) console.error('[Kompra] No se pudo asimilar el token de sesión recibido en la URL.', cause);
      })
      .finally(() => {
        if (!cancelled) setSessionParamPending(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isPending && !sessionParamPending && !effectiveSession) router.replace('/login');
  }, [error, effectiveSession, isPending, router, sessionParamPending]);

  useEffect(() => {
    if (isPending || sessionParamPending || !effectiveSession?.user) return;
    setIdentityReady(false);
    apiFetch('/users/me')
      .then(() => setIdentityReady(true))
      .catch((cause: unknown) => {
        const error = cause as Error & { status?: number; body?: unknown };
        console.error('[Kompra] No se pudo sincronizar la identidad con /api/v1/users/me.', {
          status: error.status,
          body: error.body,
          message: error.message,
          userId: effectiveSession.user.id,
          endpoint: '/api/v1/users/me',
        });
        setIdentityError(error.message || 'Error desconocido al sincronizar la identidad.');
      });
  }, [effectiveSession, isPending, sessionParamPending]);

  if (isPending || sessionParamPending) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /><p className="text-sm font-medium text-stone-500">Cargando Kompra...</p></div></div>;
  }

  if (!effectiveSession) return null;
  if (!identityReady) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f4] text-sm text-[#64736c]">{identityError ? <p role="alert">No pudimos preparar tu perfil: {identityError}</p> : <p>Preparando tu espacio…</p>}</div>;
  return <><div className="min-h-screen">{children}</div><FriendNetwork /><ListAssignmentQuick /><CategoryQuickCreate /></>;
}
