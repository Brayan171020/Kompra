'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth-client';
import { FriendNetwork } from '../../components/friend-network';
import { CategoryQuickCreate } from '../../components/category-quick-create';
import { ListAssignmentQuick } from '../../components/list-assignment-quick';
import { apiFetch } from '../../lib/api';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, isPending, error } = authClient.useSession();
  const router = useRouter();
  const [identityReady, setIdentityReady] = useState(false);
  const [identityError, setIdentityError] = useState('');

  useEffect(() => {
    if (!isPending && (error || !session)) router.replace('/login');
  }, [error, isPending, router, session]);

  useEffect(() => {
    if (isPending || !session?.user) return;
    setIdentityReady(false);
    apiFetch('/users/me')
      .then(() => setIdentityReady(true))
      .catch((cause: Error) => {
        console.error('[Kompra] No se pudo sincronizar la identidad con /api/v1/users/me.', {
          message: cause.message,
          userId: session.user.id,
          endpoint: '/api/v1/users/me',
        });
        setIdentityError(cause.message);
      });
  }, [isPending, session]);

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /><p className="text-sm font-medium text-stone-500">Cargando Kompra...</p></div></div>;
  }

  if (error || !session) return null;
  if (!identityReady) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f4] text-sm text-[#64736c]">{identityError ? <p role="alert">No pudimos preparar tu perfil: {identityError}</p> : <p>Preparando tu espacio…</p>}</div>;
  return <><div className="min-h-screen">{children}</div><FriendNetwork /><ListAssignmentQuick /><CategoryQuickCreate /></>;
}
