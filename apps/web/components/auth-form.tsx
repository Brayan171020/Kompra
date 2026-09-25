'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, LoaderCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient, useSession } from '../lib/auth-client';
import Link from 'next/link';
import { AuthShell } from './auth-shell';

export function LoginForm() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    if (!sessionPending && session?.user) router.replace('/app');
  }, [router, session, sessionPending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) { setErrorMsg(error.message || 'Error al iniciar sesión'); return; }
      if (data) { router.push('/app'); router.refresh(); }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión con el servidor');
    } finally { setLoading(false); }
  }

  async function sendMagicLink() {
    if (!email) { setErrorMsg('Escribe tu correo para enviarte el enlace.'); return; }
    setMagicLoading(true); setErrorMsg(''); setMagicSent(false);
    try {
      const { error } = await authClient.signIn.magicLink({ email, callbackURL: '/app' });
      if (error) { setErrorMsg(error.message || 'No pudimos enviar el enlace.'); return; }
      setMagicSent(true);
    } catch (err: unknown) { setErrorMsg(err instanceof Error ? err.message : 'No pudimos enviar el enlace.'); }
    finally { setMagicLoading(false); }
  }

  async function signInWithGoogle() {
    setErrorMsg('');
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: '/app' });
    if (error) setErrorMsg(error.message || 'No pudimos iniciar sesión con Google.');
  }

  return <AuthShell title="Qué bueno verte." description="Entra para retomar tus encargos y seguir organizando tus compras.">
    <div className="mt-9 space-y-4">
      <button type="button" onClick={signInWithGoogle} className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#d5dfd7] bg-white px-5 text-sm font-semibold text-[#355448] transition hover:border-[#9ab8a2] hover:bg-[#fbfcfa]"><GoogleMark /> Continuar con Google</button>
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-[#a0ada4]"><span className="h-px flex-1 bg-[#dce4dd]" />o ingresa con tu contraseña<span className="h-px flex-1 bg-[#dce4dd]" /></div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <ErrorMessage message={errorMsg} />
        {magicSent ? <p role="status" className="rounded-xl bg-[#f0f6df] px-4 py-3 text-sm leading-6 text-[#52712e]">Te hemos enviado un enlace de acceso a tu correo.</p> : null}
        <button disabled={loading} className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#173d34] px-5 text-sm font-semibold text-white transition hover:bg-[#245649] disabled:cursor-wait disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />} {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</button>
      </form>
      <button type="button" onClick={sendMagicLink} disabled={magicLoading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#cfe0b6] bg-[#edf5df] px-4 text-sm font-semibold text-[#52712e] transition hover:bg-[#e3efc8] disabled:opacity-60"><KeyRound size={17} /> {magicLoading ? 'Enviando enlace…' : 'Enviar enlace de acceso a mi correo'}</button>
      <p className="pt-1 text-center text-sm text-[#718078]">¿Aún no tienes cuenta? <Link href="/register" className="font-semibold text-[#47725c] hover:underline">Crear cuenta</Link></p>
    </div>
  </AuthShell>;
}

function GoogleMark() { return <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4] shadow-sm">G</span>; }
function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <label className="block text-sm font-semibold text-[#355448]">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-2 h-13 w-full rounded-2xl border border-[#d5dfd7] bg-white px-4 text-base font-normal text-[#18231f] outline-none transition placeholder:text-[#a1ada5] focus:border-[#6c9b77] focus:ring-4 focus:ring-[#cfe3d3]" /></label>; }
function ErrorMessage({ message }: { message: string }) { return message ? <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#9b4f3e]">{message}</p> : null; }
