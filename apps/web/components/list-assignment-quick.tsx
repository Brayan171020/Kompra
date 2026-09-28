'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ListChecks, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

type List = { id: string; creatorId: string; title: string; status: string; assignedToId: string | null; copyToAssigneeInventory: boolean };
type Contact = { id: string; name: string; role: string };

export function ListAssignmentQuick() {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listId, setListId] = useState('');
  const [contactId, setContactId] = useState('');
  const [copyToAssigneeInventory, setCopyToAssigneeInventory] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCopyToAssigneeInventory(false); setMessage(''); setError('');
    Promise.all([
      apiFetch<List[]>('/lists'),
      apiFetch<Contact[]>('/users/contacts'),
      apiFetch<{ user: { id: string } }>('/users/me'),
    ]).then(([nextLists, nextContacts, profile]) => {
      setLists(nextLists.filter((list) => list.status === 'ACTIVE' && list.creatorId === profile.user.id));
      setContacts(nextContacts);
    }).catch((cause: Error) => setError(cause.message));
  }, [open]);

  async function assign() {
    setError(''); setMessage('');
    try {
      await apiFetch(`/lists/${listId}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedToId: contactId, copyToAssigneeInventory }) });
      setMessage('Lista asignada correctamente.');
    } catch (cause) { setError((cause as Error).message); }
  }

  const selectedContact = contacts.find((contact) => contact.id === contactId);
  return <>
    <button onClick={() => setOpen(true)} aria-label="Asignar lista a un contacto" className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#d5dfd7] bg-white px-2 text-[11px] font-semibold text-[#355448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c9b77] sm:w-auto sm:gap-2 sm:rounded-full sm:px-4 sm:text-xs"><ListChecks size={16} /> Asignar lista</button>
    {open ? <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#173d34]/25 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="assign-title" className="max-h-[min(90dvh,48rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl sm:rounded-2xl sm:pb-5">
        <div className="flex items-center justify-between"><h2 id="assign-title" className="text-xl font-semibold text-[#355448]">Asignar lista a amigo</h2><button onClick={() => setOpen(false)} aria-label="Cerrar asignación"><X size={18} /></button></div>
        <label className="mt-5 block text-sm font-semibold text-[#355448]">Lista<select value={listId} onChange={(event) => { const selected = lists.find((list) => list.id === event.target.value); setListId(event.target.value); setContactId(selected?.assignedToId ?? ''); setCopyToAssigneeInventory(selected?.copyToAssigneeInventory ?? false); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5dfd7] bg-white px-3 text-sm"><option value="">Selecciona una lista</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold text-[#355448]">Amigo<select value={contactId} onChange={(event) => { setContactId(event.target.value); const selected = lists.find((list) => list.id === listId); setCopyToAssigneeInventory(selected?.assignedToId === event.target.value && selected.copyToAssigneeInventory); }} className="mt-2 h-11 w-full rounded-xl border border-[#d5dfd7] bg-white px-3 text-sm"><option value="">Selecciona un contacto</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.role}</option>)}</select></label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f7f8f4] p-3 text-sm text-[#355448]"><input type="checkbox" checked={copyToAssigneeInventory} onChange={(event) => setCopyToAssigneeInventory(event.target.checked)} className="mt-0.5 size-4 accent-[#173d34]" /><span>Guardar también las compras de esta lista en el inventario de {selectedContact?.name ?? 'la persona asignada'}.</span></label>
        {message ? <p role="status" className="mt-3 text-sm text-[#52712e]">{message}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-[#9b4f3e]">{error}</p> : null}
        <button onClick={assign} disabled={!listId || !contactId} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173d34] text-sm font-semibold text-white disabled:opacity-40">Asignar <ArrowRight size={16} /></button>
      </section>
    </div> : null}
  </>;
}
