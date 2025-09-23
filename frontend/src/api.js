const API_BASE_URL = (typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.") ||
  window.location.hostname.endsWith(".local")
))
  ? "http://127.0.0.1:5000/api"
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

/** Envía respuestas (parciales o completas) del cuestionario. */
export const enviarCuestionario = async (cuestionarioData) => {
  const response = await fetch(`${API_BASE_URL}/cuestionario`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cuestionarioData),
  });
  return handleResponse(response);
};

/** Envía con keepalive (retorna booleano, no lanza errores). */
export const enviarCuestionarioKeepAlive = async (cuestionarioData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/cuestionario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify(cuestionarioData),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
};

/** Obtiene respuestas guardadas del cuestionario para un usuario. */
export const obtenerRespuestas = async (id_usuario) => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id_usuario}/respuestas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse(response);
};

/** Finaliza el cuestionario de un usuario. */
export const finalizarCuestionario = async (id_usuario, bodyData) => {
  const response = await fetch(`${API_BASE_URL}/cuestionario/${id_usuario}/finalizar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bodyData ? JSON.stringify(bodyData) : undefined,
  });
  return handleResponse(response);
};