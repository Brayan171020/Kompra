'use client';

import { FormEvent, useState } from 'react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from '../lib/auth-client';
import Link from 'next/link';
import { AuthShell } from './auth-shell';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    const result = await signIn.email({ email, password }, { onError: (context) => setError(context.error.message || 'No pudimos iniciar sesión.') });
    setPending(false);
    if (result.data) router.push('/app');
  }

  return <AuthShell title="Qué bueno verte." description="Entra para retomar la lista y seguir organizando la casa."><form onSubmit={submit} className="mt-9 space-y-5" noValidate><Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email" /><Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" /><ErrorMessage message={error} /><button disabled={pending} className="mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#173d34] px-5 text-sm font-semibold text-white transition hover:bg-[#245649] disabled:cursor-wait disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />} {pending ? 'Entrando…' : 'Iniciar sesión'}</button><p className="pt-3 text-center text-sm text-[#718078]">¿Aún no tienes cuenta? <Link href="/register" className="font-semibold text-[#47725c] hover:underline">Crear cuenta</Link></p></form></AuthShell>;
}

function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <label className="block text-sm font-semibold text-[#355448]">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-2 h-13 w-full rounded-2xl border border-[#d5dfd7] bg-white px-4 text-base font-normal text-[#18231f] outline-none transition placeholder:text-[#a1ada5] focus:border-[#6c9b77] focus:ring-4 focus:ring-[#cfe3d3]" /></label>; }
function ErrorMessage({ message }: { message: string }) { return message ? <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#9b4f3e]">{message}</p> : null; }
