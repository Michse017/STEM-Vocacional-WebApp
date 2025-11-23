const API_BASE_URL = (typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.") ||
  window.location.hostname.endsWith(".local")
))
  ? "http://localhost:5000/api"
  : "https://stem-backend-9sc0.onrender.com/api";

/**
 * Normaliza respuestas HTTP y errores.
 */
const handleResponse = async (response) => {
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    let errorMessage = data.error || data.message;
    if (!errorMessage && data.missing) {
      const parts = Object.entries(data.missing)
        .map(([section, fields]) => `${section}: ${Array.isArray(fields) ? fields.join(', ') : JSON.stringify(fields)}`)
        .join(' | ');
      errorMessage = `Faltan campos por completar -> ${parts}`;
    }
    if (!errorMessage) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

/** Crea o recupera un usuario por código de estudiante. */
export const crearOObtenerUsuario = async (codigoEstudiante) => {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codigo_estudiante: codigoEstudiante }),
  });
  if (response.status === 404) {
    throw new Error("El código ingresado no está registrado.");
  }
  if (response.status === 400) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "El campo 'codigo_estudiante' es requerido.");
  }
  return handleResponse(response);
};

// Legacy questionnaire API functions removed: enviarCuestionario, enviarCuestionarioKeepAlive,
// obtenerRespuestas, finalizarCuestionario. Dynamic engine is the primary path now.

// --- Dynamic Questionnaire Public APIs ---

export const listDynamicQuestionnaires = async () => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires`, { method: "GET" });
  return handleResponse(res);
};

export const getDynamicQuestionnaire = async (code) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}`, { method: "GET" });
  return handleResponse(res);
};

export const submitDynamicResponse = async (code, payload) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return handleResponse(res);
};

export const getMyDynamicStatus = async (code, userCode) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}/mine?user_code=${encodeURIComponent(userCode)}`, { method: "GET" });
  return handleResponse(res);
};

export const getDynamicOverview = async (userCode) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/overview?user_code=${encodeURIComponent(userCode || '')}`, { method: "GET" });
  return handleResponse(res);
};

export const getPrefillValues = async (userCode, codes) => {
  const qs = new URLSearchParams({ user_code: userCode || '', codes: (codes||[]).join(',') });
  const res = await fetch(`${API_BASE_URL}/dynamic/prefill?${qs.toString()}`, { method: 'GET' });
  return handleResponse(res);
};

export const saveDynamicResponse = async (code, payload) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return handleResponse(res);
};

export const finalizeDynamicResponse = async (code, payload) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return handleResponse(res);
};

export const saveDynamicResponseKeepAlive = async (code, payload) => {
  try {
    const res = await fetch(`${API_BASE_URL}/dynamic/questionnaires/${encodeURIComponent(code)}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payload || {}),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
};

// --- UX Survey (usabilidad) ---

// Obtiene estado y estructura (si pendiente) de la encuesta de usabilidad.
export const getUxSurveyStatus = async (userCode) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/ux-survey/status?user_code=${encodeURIComponent(userCode || '')}`, { method: 'GET' });
  return handleResponse(res);
};

// Envía respuestas de la encuesta de usabilidad.
export const submitUxSurvey = async ({ userCode, answers, comment }) => {
  const res = await fetch(`${API_BASE_URL}/dynamic/ux-survey/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_code: userCode || '', answers: answers || {}, comment: comment || '' })
  });
  return handleResponse(res);
};

// --- Student Auth (code-first, admin pre-registered) ---

export const checkUsuario = async (codigoEstudiante) => {
  const res = await fetch(`${API_BASE_URL}/usuarios/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_estudiante: codigoEstudiante })
  });
  if (res.status === 404) return { error: 'not_found' };
  return handleResponse(res);
};

export const setupCredenciales = async ({ codigoEstudiante, username, password, confirm }) => {
  const res = await fetch(`${API_BASE_URL}/usuarios/setup-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_estudiante: codigoEstudiante, username, password, confirm })
  });
  return handleResponse(res);
};

export const loginConPassword = async ({ codigoEstudiante, password }) => {
  const res = await fetch(`${API_BASE_URL}/usuarios/login-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_estudiante: codigoEstudiante, password })
  });
  if (res.status === 404) throw new Error('El código ingresado no está registrado.');
  return handleResponse(res);
};