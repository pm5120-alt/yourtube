const base = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export function backendConfigured() { return !!base; }

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!base) throw new Error('Backend is not configured');
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  let data: any = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data as T;
}
