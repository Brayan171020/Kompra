import { ArrowLeft, Check, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';

export function AuthShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <main className="min-h-screen w-full bg-[#f7f8f4] text-[#18231f]">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <aside className="hidden h-full w-full flex-col justify-between bg-[#173d34] p-10 text-white lg:flex xl:p-16">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-[-.04em]"><span className="grid size-9 place-items-center rounded-xl bg-[#d9f96e] text-sm font-bold text-[#173d34]">K</span>kompra<span className="text-[#9db9a9]">.</span></Link>
          <div><div className="mb-8 grid size-14 place-items-center rounded-2xl bg-[#2d594c] text-[#d9f96e]"><ShoppingBasket size={27} /></div><h2 className="max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-.06em]">Las compras del día, con menos ruido.</h2><div className="mt-8 space-y-4 text-sm text-[#b5cec0]"><p className="flex items-center gap-3"><Check size={17} className="text-[#d9f96e]" />Listas que todos pueden entender</p><p className="flex items-center gap-3"><Check size={17} className="text-[#d9f96e]" />Un inventario que siempre puedes consultar</p></div></div>
          <p className="text-xs text-[#8eaa9b]">Organización cotidiana, hecha para compartir.</p>
        </aside>
        <section className="flex min-h-screen w-full min-w-0 flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24">
          <Link href="/" className="mb-16 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#64736c] transition hover:text-[#173d34] lg:mb-auto"><ArrowLeft size={16} /> Volver al inicio</Link>
          <div className="mx-auto w-full max-w-md pb-10"><div className="mb-10 lg:hidden"><Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-[-.04em]"><span className="grid size-9 place-items-center rounded-xl bg-[#173d34] text-sm font-bold text-[#d9f96e]">K</span>kompra<span className="text-[#83a996]">.</span></Link></div><h1 className="text-4xl font-semibold tracking-[-.06em]">{title}</h1><p className="mt-3 leading-7 text-[#64736c]">{description}</p>{children}</div>
        </section>
      </div>
    </main>
  );
}
