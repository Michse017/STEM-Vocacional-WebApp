import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { crearOObtenerUsuario } from "../api"
import { api as adminApi } from "../admin/api"

export default function Login() {
  const [codigoEstudiante, setCodigoEstudiante] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const navigate = useNavigate()

  // If already logged in (student or admin), redirect away from login
  useEffect(() => {
    // Admin session takes precedence
    try {
      const adminToken = localStorage.getItem('admin_token')
      if (adminToken) {
        navigate('/admin', { replace: true })
        return
      }
    } catch (_) {}
    try {
      const u = JSON.parse(sessionStorage.getItem('usuario') || 'null')
      if (u && u.id_usuario) {
        navigate('/dashboard', { replace: true })
      }
    } catch (_) {}
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!codigoEstudiante.trim()) {
      setError(isAdmin ? "Por favor, ingresa tu usuario (código)." : "Por favor, ingresa tu código de estudiante.")
      return
    }
    setLoading(true)
    setError("")

    try {
      if (isAdmin) {
        // Admin login via JWT
        if (!adminPassword.trim()) throw new Error("Por favor, ingresa tu contraseña.")
        const res = await adminApi('/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigoEstudiante, password: adminPassword })
        })
        if (res?.access_token) {
          try { localStorage.setItem('admin_token', res.access_token) } catch (_) {}
          navigate('/admin', { replace: true })
          return
        }
        throw new Error("No se pudo iniciar sesión como administrador.")
      } else {
        // Student flow (dinámico): crear/obtener usuario y llevar al dashboard
        const usuario = await crearOObtenerUsuario(codigoEstudiante)
        if (!usuario || !usuario.id_usuario) {
          throw new Error("El código ingresado no está registrado.")
        }
        try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
        // El dashboard decide el siguiente paso usando /dynamic/overview
        navigate("/dashboard", { replace: true })
      }
    } catch (err) {
      // Mensajes claros para códigos inexistentes
      const msg = String(err.message || "Ocurrió un error al iniciar sesión.")
      if (!codigoEstudiante.trim()) {
        setError(isAdmin ? "Por favor, ingresa tu usuario (código)." : "Por favor, ingresa tu código de estudiante.")
      } else if (!isAdmin && (msg.toLowerCase().includes('no está registrado') || msg.includes('404'))) {
        setError('El código ingresado no está registrado. Verifica e intenta nuevamente.')
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
      }}
    >
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "28rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 4px 12px rgba(0, 112, 243, 0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{isAdmin ? 'Acceso Administrador' : 'Bienvenido'}</h2>
          <p style={{ color: "var(--text-muted-light)", fontSize: "1rem" }}>
            {isAdmin ? 'Ingresa tus credenciales de administrador' : 'Ingresa tu código de estudiante para comenzar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-light)",
              }}
            >
              {isAdmin ? 'Usuario (código)' : 'Código de estudiante'}
            </label>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted-light)",
                  pointerEvents: "none",
                }}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                required
                value={codigoEstudiante}
                onChange={(e) => setCodigoEstudiante(e.target.value)}
                placeholder={isAdmin ? 'ej: admin' : 'Ej: 000123456'}
                className="form-control"
                style={{ paddingLeft: "3rem" }}
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "var(--text-light)",
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="form-control"
              />
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
            style={{ width: "100%" }}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                {isAdmin ? 'Ingresando...' : 'Validando...'}
              </>
            ) : (
              <>
                {isAdmin ? 'Entrar' : 'Ingresar'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 14 }}>
            {isAdmin ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsAdmin(false); setError(""); setAdminPassword(""); }}
              >
                Soy estudiante
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsAdmin(true); setError(""); }}
              >
                Soy administrador
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
