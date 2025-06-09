import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api"

export default function Login() {
  const [codigo, setCodigo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await login(codigo.trim())

    if (res.success) {
      localStorage.setItem("codigo_estudiante", res.codigo_estudiante)
      navigate("/cuestionario")
    } else {
      setError(res.message || "Código incorrecto")
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f8ff 0%, #f0fff4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          padding: "2rem",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#e3f2fd",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="#0070f3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="#0070f3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#333", marginBottom: "0.5rem" }}>
            Inicio de sesión
          </h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Ingresa tu código de estudiante para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Código de estudiante
            </label>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
                width="16"
                height="16"
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
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ingresa tu código"
                style={{
                  width: "100%",
                  padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem",
              }}
            >
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                type="password"
                value={password}
                autoComplete="off"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                style={{
                  width: "100%",
                  padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#9ca3af" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = "#0051cc")}
            onMouseOut={(e) => !loading && (e.target.style.background = "#0070f3")}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
