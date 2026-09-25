import { authClient } from './auth-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: session } = await authClient.getSession();
  const token = (session?.session as { token?: string } | undefined)?.token;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else if (session?.user) console.warn('[Kompra] Sesión activa sin token Bearer para la API.', { userId: session.user.id, path });

  const response = await fetch(`${apiUrl}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? 'No pudimos completar la operación.');
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}
