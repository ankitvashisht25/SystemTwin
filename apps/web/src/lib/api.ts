const BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('systemtwin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Only auto-logout on 401 for non-auth routes (session expired).
  // Auth routes (login/register) return 401 for wrong credentials —
  // those should be handled by the caller.
  if (res.status === 401 && !path.startsWith('/api/auth') && token) {
    localStorage.removeItem('systemtwin_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  return res;
}
