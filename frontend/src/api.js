const API_BASE_URL = "https://stem-backend-9sc0.onrender.com/api";

/**
 * Maneja las respuestas de la API, parseando el JSON y manejando errores.
 * @param {Response} response - El objeto de respuesta de la API.
 * @returns {Promise<any>} - Los datos JSON de la respuesta.
 * @throws {Error} - Lanza un error si la respuesta no es OK.
 */
const handleResponse = async (response) => {
  // Si la respuesta es 404, no es un error fatal, sino que no hay datos.
  // Devolvemos null para que el frontend pueda manejarlo.
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMessage = data.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  // Para respuestas 204 No Content o si el cuerpo está vacío
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

/**
 * Crea un nuevo usuario o recupera uno existente por su código de estudiante.
 * @param {string} codigoEstudiante - El código del estudiante.
 * @returns {Promise<any>} - Los datos del usuario creado o recuperado.
 */
export const crearOObtenerUsuario = async (codigoEstudiante) => {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codigo_estudiante: codigoEstudiante }),
  });
  return handleResponse(response);
};

/**
 * Envía las respuestas (parciales o completas) del cuestionario al backend.
 * @param {object} cuestionarioData - El objeto con id_usuario y las respuestas.
 * @returns {Promise<any>} - La confirmación del backend.
 */
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

/**
 * Obtiene las respuestas guardadas de un cuestionario para un usuario específico.
 * @param {number} id_usuario - El ID del usuario.
 * @returns {Promise<any|null>} - Las respuestas del cuestionario o null si no existen.
 */
export const obtenerRespuestas = async (id_usuario) => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id_usuario}/respuestas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return handleResponse(response);
};