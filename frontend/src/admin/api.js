const API_BASE = process.env.REACT_APP_ADMIN_API_BASE || (
  (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.") ||
    window.location.hostname.endsWith(".local")
  ))
    ? "http://localhost:5000/api"
    : "https://stem-backend-9sc0.onrender.com/api"
);
const ADMIN_ACCESS_KEY = process.env.REACT_APP_ADMIN_ACCESS_KEY || '';

export async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (ADMIN_ACCESS_KEY) headers.set('X-Admin-Access', ADMIN_ACCESS_KEY);
  // Optional JWT from localStorage (set after /auth/admin/login)
  try {
    const token = localStorage.getItem('admin_token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  } catch (_) {}
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: 'include' });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (res.ok) return data;
  // On 401, try to refresh (once) then retry the original request
  if (res.status === 401 && path !== '/auth/admin/login' && path !== '/auth/admin/refresh') {
    try {
      const r = await fetch(`${API_BASE}/auth/admin/refresh`, { method: 'POST', credentials: 'include' });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.access_token) {
        try { localStorage.setItem('admin_token', j.access_token); } catch (_) {}
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${j.access_token}`);
        const retried = await fetch(`${API_BASE}${path}`, { ...opts, headers: retryHeaders, credentials: 'include' });
        const retriedData = await retried.json().catch(() => null);
        if (!retried.ok) throw new Error(retriedData?.error || `HTTP ${retried.status}`);
        return retriedData;
      }
    } catch (_) {}
  }
  throw new Error(data?.error || `HTTP ${res.status}`);
}

export async function deleteQuestionnaire(code) {
  return api(`/admin/questionnaires/${encodeURIComponent(code)}`, { method: 'DELETE' });
}
