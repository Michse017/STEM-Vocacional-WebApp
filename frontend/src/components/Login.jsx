import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { crearOObtenerUsuario, obtenerRespuestas } from "../api"

export default function Login() {
  const [codigoEstudiante, setCodigoEstudiante] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!codigoEstudiante.trim()) {
      setError("Por favor, ingresa tu código de estudiante.")
      return
    }
    setLoading(true)
    setError("")

    try {
      const usuario = await crearOObtenerUsuario(codigoEstudiante)
      if (!usuario || !usuario.id_usuario) {
        throw new Error("El código ingresado no está registrado.")
      }
      const respuestasGuardadas = await obtenerRespuestas(usuario.id_usuario)
      if (respuestasGuardadas) {
        navigate("/dashboard", { state: { usuario, respuestas: respuestasGuardadas } })
      } else {
        navigate("/cuestionario", { state: { usuario } })
      }
    } catch (err) {
      // Mensajes claros para códigos inexistentes
      const msg = String(err.message || "Ocurrió un error al iniciar sesión.")
      if (!codigoEstudiante.trim()) {
        setError("Por favor, ingresa tu código de estudiante.")
      } else if (msg.toLowerCase().includes('no está registrado') || msg.includes('404')) {
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Bienvenido</h2>
          <p style={{ color: "var(--text-muted-light)", fontSize: "1rem" }}>
            Ingresa tu código de estudiante para comenzar
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
              Código de estudiante
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
                placeholder="Ej: 000123456"
                className="form-control"
                style={{ paddingLeft: "3rem" }}
              />
            </div>
          </div>

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
                Validando...
              </>
            ) : (
              <>
                Ingresar
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
        </form>
      </div>
    </div>
  )
}
