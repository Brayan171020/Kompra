'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ClipboardList, Package, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { signOut, useSession } from '../lib/auth-client';

type Connection = 'checking' | 'connected' | 'offline';

export default function Home() {
  const [connection, setConnection] = useState<Connection>('checking');
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/health`, { signal: AbortSignal.timeout(3500) })
      .then((response) => { if (!response.ok) throw new Error('API unavailable'); setConnection('connected'); })
      .catch(() => setConnection('offline'));
  }, []);

  const statusLabel = connection === 'connected' ? 'Backend conectado' : connection === 'checking' ? 'Comprobando conexión' : 'Backend sin conexión';

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-[#18231f]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#dce4dd] pb-5">
          <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-[#173d34] text-sm font-bold text-[#d9f96e]">K</span><span className="text-lg font-semibold tracking-[-0.04em]">kompra<span className="text-[#83a996]">.</span></span></div>
          <nav className="flex items-center gap-2" aria-label="Navegación principal">
            {isAuthenticated ? <><Link href="/app" className="hidden rounded-full bg-[#173d34] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#245649] sm:inline-flex">Ir a la App</Link><button onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })} className="rounded-full px-3 py-2.5 text-xs font-semibold text-[#64736c] transition hover:bg-white hover:text-[#173d34]">Cerrar sesión</button></> : <><Link href="/login" className="rounded-full px-3 py-2.5 text-xs font-semibold text-[#64736c] transition hover:bg-white hover:text-[#173d34]">Iniciar sesión</Link><Link href="/register" className="rounded-full bg-[#173d34] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#245649]">Registrarse</Link></>}
          </nav>
          <div className="flex items-center gap-2 text-xs font-medium text-[#60716a]"><span className={`size-2 rounded-full ${connection === 'connected' ? 'bg-[#8fbf3f]' : connection === 'offline' ? 'bg-[#d7795f]' : 'animate-pulse bg-[#d7ad4a]'}`} />{statusLabel}</div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#cddccf] bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.14em] text-[#47725c]"><Sparkles size={14} /> Orden cotidiano, sin fricción</div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[.96] tracking-[-.065em] sm:text-7xl">Las compras funcionan mejor <span className="text-[#6b9140]">con contexto.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#64736c]">Listas compartidas, compras claras y un inventario que te ayuda a saber qué hay en casa antes de salir.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href={isAuthenticated ? '/app' : '/login'} className="inline-flex items-center gap-2 rounded-full bg-[#173d34] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#173d34]/15 transition hover:bg-[#245649]">Crear una lista <ArrowUpRight size={17} /></Link><Link href={isAuthenticated ? '/app/inventory' : '/login'} className="rounded-full border border-[#cddccf] bg-white px-5 py-3.5 text-sm font-semibold text-[#355448] transition hover:border-[#9ab8a2]">Explorar despensa</Link></div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-[3rem] bg-[#e2edc4]/60 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_24px_80px_rgba(27,61,44,.12)] backdrop-blur">
              <div className="mb-7 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#8a9b90]">Esta semana</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Compra familiar</h2></div><div className="rounded-xl bg-[#f0f6df] px-3 py-2 text-right"><p className="text-xs text-[#758c56]">avance</p><p className="font-semibold text-[#52712e]">68%</p></div></div>
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#edf1e9]"><div className="h-full w-[68%] rounded-full bg-[#9bbd54]" /></div>
              <div className="space-y-2.5"><ListRow icon="🥬" label="Frutas y verduras" count="4 / 6" done /><ListRow icon="🥫" label="Víveres y sólidos" count="3 / 5" done /><ListRow icon="🧴" label="Limpieza" count="1 / 3" /><ListRow icon="🥩" label="Carnes" count="0 / 2" /></div>
              <div className="mt-6 flex items-center justify-between border-t border-[#edf0eb] pt-4 text-xs text-[#829088]"><span className="flex items-center gap-1.5"><Users size={14} /> 3 personas colaborando</span><span className="font-medium text-[#5e8063]">Ver lista →</span></div>
            </div>
          </div>
        </section>

        <footer className="grid gap-3 border-t border-[#dce4dd] py-6 sm:grid-cols-3"><Feature icon={<ClipboardList />} title="Listas vivas" text="Todos saben qué falta." /><Feature icon={<Package />} title="Despensa al día" text="Menos desperdicio, más control." /><Feature icon={<Check />} title="Compras resueltas" text="Un hogar más tranquilo." /></footer>
      </div>
    </main>
  );
}

function ListRow({ icon, label, count, done = false }: { icon: string; label: string; count: string; done?: boolean }) { return <div className="flex items-center gap-3 rounded-xl bg-[#fafbf8] px-3 py-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f0f4ec] text-lg">{icon}</span><span className="flex-1 text-sm font-medium text-[#364a40]">{label}</span><span className={`text-xs font-semibold ${done ? 'text-[#719148]' : 'text-[#9aa59d]'}`}>{count}</span></div>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#6f9650] shadow-sm">{icon}</span><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-[#829088]">{text}</p></div></div>; }
