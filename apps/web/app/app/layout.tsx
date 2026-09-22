'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth-client';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, isPending, error } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (error || !session)) router.replace('/login');
  }, [error, isPending, router, session]);

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /><p className="text-sm font-medium text-stone-500">Cargando Kompra...</p></div></div>;
  }

  if (error || !session) return null;
  return <>{children}</>;
}
