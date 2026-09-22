'use client';

import { FormEvent, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

export function CategoryQuickCreate() {
  const [open, setOpen] = useState(false); const [name, setName] = useState(''); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); try { await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name }) }); setName(''); setSaved(true); window.setTimeout(() => { setSaved(false); setOpen(false); }, 900); } catch (cause) { setError((cause as Error).message); } }
  return <div className="fixed bottom-5 left-5 z-20">{open ? <form onSubmit={submit} className="mb-2 w-72 rounded-2xl border border-[#e0e8df] bg-white p-4 shadow-xl"><div className="flex items-center justify-between"><strong className="text-sm text-[#355448]">Nueva categoría</strong><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar nueva categoría"><X size={16} /></button></div><input autoFocus required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Congelados" className="mt-3 h-11 w-full rounded-xl border border-[#d5dfd7] px-3 text-sm outline-none focus:border-[#6c9b77]" />{error ? <p role="alert" className="mt-2 text-xs text-[#9b4f3e]">{error}</p> : null}<button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#173d34] text-xs font-semibold text-white">{saved ? <Check size={15} /> : <Plus size={15} />} {saved ? 'Creada' : 'Guardar categoría'}</button></form> : null}<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#d5dfd7] bg-white px-4 py-3 text-xs font-semibold text-[#355448] shadow-lg shadow-[#173d34]/10"><Plus size={16} /> Nueva categoría</button></div>;
}
