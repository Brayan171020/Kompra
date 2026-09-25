import { authClient, getBootstrapSessionToken } from './auth-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiFetchError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
    this.name = 'ApiFetchError';
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: session } = await authClient.getSession();
  const token = (session?.session as { token?: string } | undefined)?.token ?? getBootstrapSessionToken();
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
    throw new ApiFetchError(payload?.message ?? 'No pudimos completar la operación.', response.status, payload);
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}
