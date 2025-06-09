const API_BASE = "http://localhost:5000/api";

export async function login(codigo_estudiante) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ codigo_estudiante }),
  });
  return res.json();
}

export async function getCuestionario(codigo_estudiante) {
  const res = await fetch(`${API_BASE}/cuestionario?codigo_estudiante=${encodeURIComponent(codigo_estudiante)}`, {
    credentials: 'include'
  });
  return res.json();
}

export async function saveCuestionario(codigo_estudiante, respuestas) {
  const res = await fetch(`${API_BASE}/cuestionario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ codigo_estudiante, respuestas }),
  });
  return res.json();
}

export async function getDashboard(codigo_estudiante) {
  const res = await fetch(`${API_BASE}/dashboard?codigo_estudiante=${encodeURIComponent(codigo_estudiante)}`, {
    credentials: 'include'
  });
  return res.json();
}