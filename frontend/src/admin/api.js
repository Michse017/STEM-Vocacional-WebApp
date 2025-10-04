const API_BASE = process.env.REACT_APP_ADMIN_API_BASE || 'http://localhost:5001/api';
const ADMIN_ACCESS_KEY = process.env.REACT_APP_ADMIN_ACCESS_KEY || '';

export async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (ADMIN_ACCESS_KEY) headers.set('X-Admin-Access', ADMIN_ACCESS_KEY);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}
