'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Check, KeyRound, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient, signUp } from '../lib/auth-client';
import { AuthShell } from './auth-shell';
import Link from 'next/link';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [buyerInvite, setBuyerInvite] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    const invitedEmail = new URLSearchParams(window.location.search).get('email');
    if (!invitedEmail) return;
    setEmail(invitedEmail);
    setBuyerInvite(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    const result = await signUp.email({ name, email, password }, { onError: (context) => setError(context.error.message || 'Revisa los datos e inténtalo de nuevo.') });
    setPending(false);
    if (result.data) router.push('/app');
  }

  async function sendMagicLink() {
    if (!email) { setError('Escribe tu correo para enviarte el enlace.'); return; }
    setMagicLoading(true); setError('');
    try {
      const { error: magicError } = await authClient.signIn.magicLink({ email, name, callbackURL: '/app', newUserCallbackURL: '/app' });
      if (magicError) { setError(magicError.message || 'No pudimos enviar el enlace.'); return; }
      setMagicSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos enviar el enlace.'); }
    finally { setMagicLoading(false); }
  }

  async function signUpWithGoogle() {
    setError('');
    const callbackURL = typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app';
    const { data, error: socialError } = await authClient.signIn.social({ provider: 'google', callbackURL, newUserCallbackURL: callbackURL, disableRedirect: true });
    if (socialError) setError(socialError.message || 'No pudimos continuar con Google.');
    else if (data?.url) window.location.assign(data.url);
  }

  return <AuthShell title="Empieza a organizar." description="Crea tu espacio para coordinar encargos y registrar cualquier compra.">
    <div className="mt-9 space-y-4">
      {buyerInvite ? <p className="rounded-xl bg-[#f0f6df] px-4 py-3 text-sm leading-6 text-[#52712e]">Recibiste una invitación de comprador. Continúa con Google o con el enlace de acceso usando este correo para activarla.</p> : <p className="text-sm leading-6 text-[#718078]">Las cuentas nuevas comienzan como creadoras. Para participar como comprador necesitas una invitación enviada a tu correo.</p>}
      <button type="button" onClick={signUpWithGoogle} className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#d5dfd7] bg-white px-5 text-sm font-semibold text-[#355448] transition hover:border-[#9ab8a2] hover:bg-[#fbfcfa]"><GoogleMark /> Continuar con Google</button>
      {error ? <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#9b4f3e]">{error}</p> : null}
      {magicSent ? <p role="status" className="rounded-xl bg-[#f0f6df] px-4 py-3 text-sm leading-6 text-[#52712e]">Revisa tu correo: te enviamos un enlace para continuar.</p> : null}
      {!buyerInvite ? <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-[#a0ada4]"><span className="h-px flex-1 bg-[#dce4dd]" />o crea tu cuenta<span className="h-px flex-1 bg-[#dce4dd]" /></div> : null}
      {!buyerInvite ? <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Tu nombre" type="text" value={name} onChange={setName} autoComplete="name" />
        <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <button disabled={pending} className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#173d34] px-5 text-sm font-semibold text-white transition hover:bg-[#245649] disabled:cursor-wait disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Check size={18} />} {pending ? 'Creando espacio…' : 'Crear mi cuenta'}</button>
      </form> : null}
      <button type="button" onClick={sendMagicLink} disabled={magicLoading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#cfe0b6] bg-[#edf5df] px-4 text-sm font-semibold text-[#52712e] transition hover:bg-[#e3efc8] disabled:opacity-60"><KeyRound size={17} /> {magicLoading ? 'Enviando enlace…' : 'Enviar enlace de acceso a mi correo'}</button>
      <p className="pt-1 text-center text-sm text-[#718078]">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-[#47725c] hover:underline">Iniciar sesión</Link></p>
    </div>
  </AuthShell>;
}

function GoogleMark() { return <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4] shadow-sm">G</span>; }
function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <label className="block text-sm font-semibold text-[#355448]">{label}<input required minLength={type === 'password' ? 8 : undefined} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-2 h-13 w-full rounded-2xl border border-[#d5dfd7] bg-white px-4 text-base font-normal text-[#18231f] outline-none transition focus:border-[#6c9b77] focus:ring-4 focus:ring-[#cfe3d3]" /></label>; }
