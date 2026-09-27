'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

type Category = { id: string; name: string; color: string };
type TemplateItem = { id?: string; categoryId: string; name: string; quantityType: 'UNIT' | 'WEIGHT'; targetQuantity: number; note?: string | null };
type Template = { id: string; title: string; items: TemplateItem[]; updatedAt?: string };
type Props = { open: boolean; onClose: () => void; categories: Category[]; currentList?: { id: string; title: string; status: 'ACTIVE' | 'FINISHED' } | null; onInstantiated: (listId: string) => Promise<void> };

const emptyItem = (categoryId: string): TemplateItem => ({ categoryId, name: '', quantityType: 'UNIT', targetQuantity: 1, note: '' });

export function TemplateManager({ open, onClose, categories, currentList, onInstantiated }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.id ?? '');
  const [newType, setNewType] = useState<'UNIT' | 'WEIGHT'>('UNIT');
  const [newQuantity, setNewQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() { setError(''); setTemplates(await apiFetch<Template[]>('/templates')); }
  useEffect(() => { if (open) load().catch((cause) => setError((cause as Error).message)); }, [open]);

  function beginEdit(template?: Template) {
    setEditing(template ?? { id: '', title: '', items: [] });
    setTitle(template?.title ?? '');
    setItems(template?.items.map((item) => ({ ...item, targetQuantity: Number(item.targetQuantity), note: item.note ?? '' })) ?? []);
    setError('');
  }

  async function saveAsTemplate() {
    if (!currentList) return;
    setBusy(true); setError('');
    try { await apiFetch(`/templates/from-list/${currentList.id}`, { method: 'POST' }); await load(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function useTemplate(template: Template) {
    setBusy(true); setError('');
    try { const list = await apiFetch<{ id: string }>(`/templates/${template.id}/instantiate`, { method: 'POST' }); await onInstantiated(list.id); onClose(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function removeTemplate(template: Template) {
    if (!window.confirm(`¿Eliminar la plantilla “${template.title}”?`)) return;
    setBusy(true); setError('');
    try { await apiFetch(`/templates/${template.id}`, { method: 'DELETE' }); await load(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError('');
    try {
      const body = { title, items: items.map(({ categoryId, name, quantityType, targetQuantity, note }) => ({ categoryId, name, quantityType, targetQuantity: Number(targetQuantity), note: note?.trim() || undefined })) };
      if (editing.id) await apiFetch(`/templates/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await apiFetch('/templates', { method: 'POST', body: JSON.stringify(body) });
      setEditing(null); await load();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim() || !newCategory) return;
    setItems((current) => [...current, { categoryId: newCategory, name: newName.trim(), quantityType: newType, targetQuantity: Number(newQuantity), note: '' }]);
    setNewName(''); setNewQuantity('1');
  }

  if (!open) return null;
  const categoryName = (categoryId: string) => categories.find((category) => category.id === categoryId)?.name ?? 'Sin categoría';
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#173d34]/30 p-0 backdrop-blur-sm sm:items-center sm:p-5">
    <section className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-7" aria-label="Plantillas predeterminadas">
      <header className="mb-6 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#829088]">Listas reutilizables</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Plantillas predeterminadas</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-[#f0f4ec] text-[#64736c]" aria-label="Cerrar"><X size={18} /></button></header>
      {error ? <p role="alert" className="mb-4 rounded-xl bg-[#fff0eb] p-3 text-sm text-[#9b4f3e]">{error}</p> : null}
      {currentList?.status === 'ACTIVE' ? <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f0f6df] p-4"><div><strong className="block text-sm text-[#355448]">Guardar lista activa como plantilla</strong><span className="text-xs text-[#718078]">{currentList.title}</span></div><button onClick={saveAsTemplate} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-[#355448] shadow-sm disabled:opacity-50"><Check size={15} /> Guardar como plantilla</button></div> : null}
      <div className="mb-4 flex justify-end"><button onClick={() => beginEdit()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173d34] px-3 text-xs font-semibold text-white"><Plus size={15} /> Crear plantilla</button></div>
      {templates.length ? <div className="space-y-3">{templates.map((template) => <article key={template.id} className="rounded-2xl border border-[#e2e9e0] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-[#355448]">{template.title}</h3><p className="mt-1 text-xs text-[#829088]">{template.items.length} productos</p></div><div className="flex gap-2"><button onClick={() => useTemplate(template)} disabled={busy} className="min-h-10 rounded-xl bg-[#edf5df] px-3 text-xs font-semibold text-[#52712e] disabled:opacity-50">Usar plantilla</button><button onClick={() => beginEdit(template)} aria-label={`Editar ${template.title}`} className="grid size-10 place-items-center rounded-xl bg-[#f0f4ec] text-[#64736c]"><Pencil size={15} /></button><button onClick={() => removeTemplate(template)} aria-label={`Eliminar ${template.title}`} disabled={busy} className="grid size-10 place-items-center rounded-xl bg-[#fff0eb] text-[#9b4f3e]"><Trash2 size={15} /></button></div></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-[#718078]">{template.items.map((item) => item.name).join(' · ') || 'Sin productos'}</p></article>)}</div> : <p className="rounded-2xl bg-[#f7f8f4] p-5 text-sm text-[#718078]">Aún no tienes plantillas guardadas. Crea una o guarda una lista activa.</p>}
    </section>
    {editing ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#173d34]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-7"><header className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{editing.id ? 'Editar plantilla' : 'Nueva plantilla'}</h2><button onClick={() => setEditing(null)} className="grid size-9 place-items-center rounded-xl bg-[#f0f4ec]" aria-label="Cerrar edición"><X size={17} /></button></header><form onSubmit={saveTemplate} className="space-y-4"><label className="block text-sm font-semibold text-[#355448]">Nombre<input required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d5dfd7] px-3" /></label><div className="max-h-56 space-y-2 overflow-auto">{items.map((item, index) => <div key={`${item.id ?? item.name}-${index}`} className="flex items-center gap-2 rounded-xl bg-[#f7f8f4] p-3"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><span className="text-xs text-[#829088]">{categoryName(item.categoryId)} · {item.targetQuantity} {item.quantityType === 'WEIGHT' ? 'kg' : 'unidades'}</span></div><button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Quitar ${item.name}`} className="grid size-9 place-items-center rounded-lg text-[#9b4f3e]"><Trash2 size={15} /></button></div>)}</div><div className="grid gap-2 rounded-2xl border border-dashed border-[#cdd9cf] p-3 sm:grid-cols-2"><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Producto" className="h-10 rounded-lg border border-[#d5dfd7] px-3 text-sm" /><select value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="h-10 rounded-lg border border-[#d5dfd7] bg-white px-2 text-sm">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input type="number" min="0.001" step="0.001" value={newQuantity} onChange={(event) => setNewQuantity(event.target.value)} className="h-10 rounded-lg border border-[#d5dfd7] px-3 text-sm" /><div className="flex gap-2"><select value={newType} onChange={(event) => setNewType(event.target.value as 'UNIT' | 'WEIGHT')} className="h-10 flex-1 rounded-lg border border-[#d5dfd7] bg-white px-2 text-sm"><option value="UNIT">Unidades</option><option value="WEIGHT">Peso (kg)</option></select><button type="button" onClick={addItem} className="grid size-10 place-items-center rounded-lg bg-[#edf5df] text-[#52712e]" aria-label="Agregar producto"><Plus size={17} /></button></div></div><button disabled={busy || !categories.length} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173d34] text-sm font-semibold text-white disabled:opacity-50">{busy ? <LoaderCircle size={17} className="animate-spin" /> : null}Guardar plantilla</button></form></section></div> : null}
  </div>;
}
