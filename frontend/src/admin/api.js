const API_BASE = process.env.REACT_APP_ADMIN_API_BASE || (
  (typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.") ||
    window.location.hostname.endsWith(".local")
  ))
    ? "http://localhost:5000/api"
    : "https://stem-backend-9sc0.onrender.com/api"
);
// Admin API now uses JWT-only auth; no shared header fallback

export async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
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

export async function listUsers({ page = 1, pageSize = 20, q = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (q && q.trim()) params.set('q', q.trim());
  return api(`/admin/users?${params.toString()}`);
}

export async function deleteUser(idUsuario) {
  return api(`/admin/users/${encodeURIComponent(idUsuario)}`, { method: 'DELETE' });
}

export async function patchVersionMetadata(versionId, metadata) {
  return api(`/admin/versions/${encodeURIComponent(versionId)}/metadata`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata_json: metadata ?? {} })
  });
}

export async function listMlModels() {
  return api(`/admin/ml/models`);
}

export async function getMlModel(modelId) {
  return api(`/admin/ml/models/${encodeURIComponent(modelId)}`);
}

export async function recomputeVersionMl(versionId, { onlyFinalized = true, limit = null, dryRun = false } = {}) {
  const body = { only_finalized: !!onlyFinalized, dry_run: !!dryRun };
  if (typeof limit === 'number' && Number.isFinite(limit)) body.limit = limit;
  return api(`/admin/versions/${encodeURIComponent(versionId)}/ml/recompute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
