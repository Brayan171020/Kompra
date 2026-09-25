'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth-client';
import { FriendNetwork } from '../../components/friend-network';
import { CategoryQuickCreate } from '../../components/category-quick-create';
import { ListAssignmentQuick } from '../../components/list-assignment-quick';
import { apiFetch } from '../../lib/api';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [identityReady, setIdentityReady] = useState(false);
  const [identityError, setIdentityError] = useState('');

  useEffect(() => {
    if (!isPending && !session) router.replace('/login');
  }, [isPending, router, session]);

  useEffect(() => {
    if (isPending || !session?.user) return;
    let cancelled = false;
    setIdentityReady(false);
    setIdentityError('');

    apiFetch('/users/me')
      .then(() => { if (!cancelled) setIdentityReady(true); })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const error = cause as Error & { status?: number; body?: unknown };
        console.error('[Kompra] No se pudo sincronizar la identidad con /api/v1/users/me.', {
          status: error.status,
          body: error.body,
          message: error.message,
          userId: session.user.id,
          endpoint: '/api/v1/users/me',
        });
        setIdentityError(error.message || 'Error desconocido al sincronizar la identidad.');
      });

    return () => { cancelled = true; };
  }, [isPending, session]);

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /><p className="text-sm font-medium text-stone-500">Cargando Kompra...</p></div></div>;
  }

  if (!session) return null;
  if (!identityReady) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f4] text-sm text-[#64736c]">{identityError ? <p role="alert">No pudimos preparar tu perfil: {identityError}</p> : <p>Preparando tu espacio…</p>}</div>;
  return <><div className="min-h-screen">{children}</div><FriendNetwork /><ListAssignmentQuick /><CategoryQuickCreate /></>;
}
