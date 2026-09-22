'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '../../lib/auth-client';

export default function AppPage() {
  const router = useRouter(); const session = useSession();
  useEffect(() => { if (!session.isPending && !session.data) router.replace('/login'); }, [router, session.data, session.isPending]);
  if (session.isPending) return <main className="grid min-h-screen place-items-center bg-[#f7f8f4] text-sm text-[#64736c]">Cargando tu espacio…</main>;
  if (!session.data) return null;
  return <main className="min-h-screen bg-[#f7f8f4] p-5 text-[#18231f] sm:p-10"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between border-b border-[#dce4dd] pb-5"><span className="text-lg font-semibold tracking-[-.04em]">kompra<span className="text-[#83a996]">.</span></span><button onClick={() => signOut({ fetchOptions: { onSuccess: () => router.replace('/login') } })} className="text-sm font-semibold text-[#47725c] hover:underline">Cerrar sesión</button></header><section className="pt-16"><p className="text-sm font-semibold text-[#6b9140]">Tu espacio</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.06em]">Listo para organizar la próxima compra.</h1><p className="mt-4 text-[#64736c]">La autenticación está activa. El motor de listas llegará en la siguiente fase.</p></section></div></main>;
}
