import { useLocation, useNavigate } from "react-router-dom"
import { secciones } from "./cuestionarioConfig"

const totalPreguntas = secciones.reduce((total, seccion) => {
  return total + seccion.preguntas.length
}, 0)

const totalPreguntasSocio = secciones.find((s) => s.id === "sociodemografica")?.preguntas.length || 0
const totalPreguntasIntel = secciones.find((s) => s.id === "inteligencias_multiples")?.preguntas.length || 0

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  const { usuario, respuestas } = location.state || {}

  const handleLogout = () => {
    navigate("/login", { replace: true })
  }

  const handleContinue = () => {
    navigate("/cuestionario", { state: { usuario, respuestas } })
  }

  if (!usuario || !respuestas) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>No se han cargado datos</h2>
          <p style={{ color: "var(--text-muted-light)", marginBottom: "1.5rem" }}>
            Por favor, inicia sesión para continuar.
          </p>
          <button onClick={() => navigate("/login")} className="btn btn-primary">
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  const respuestasSocio = respuestas.sociodemografica || {}
  const respuestasIntel = respuestas.inteligencias_multiples || {}

  const completadoSocio = Object.values(respuestasSocio).filter((v) => v !== null && v !== "").length
  const progresoSocio = totalPreguntasSocio > 0 ? Math.round((completadoSocio / totalPreguntasSocio) * 100) : 0

  const completadoIntel = Object.values(respuestasIntel).filter((v) => v !== null && v !== "").length
  const progresoIntel = totalPreguntasIntel > 0 ? Math.round((completadoIntel / totalPreguntasIntel) * 100) : 0

  const completadoTotal = completadoSocio + completadoIntel
  const progresoTotal = totalPreguntas > 0 ? Math.round((completadoTotal / totalPreguntas) * 100) : 0

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
        padding: "2rem 1rem",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
            }}
          >
            Resumen de tu Progreso
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--text-muted-light)" }}>
            Hola, <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>{usuario.codigo_estudiante}</span>.
            Aquí puedes ver cuánto has avanzado.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="card animate-fade-in">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Progreso General</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "0.75rem",
                    height: "0.75rem",
                    background: "linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted-light)" }}>En progreso</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>{progresoTotal}% completado</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted-light)" }}>
                  {completadoTotal} de {totalPreguntas} preguntas
                </span>
              </div>
              <div className="progress-container" style={{ height: "0.75rem" }}>
                <div className="progress-bar" style={{ width: `${progresoTotal}%` }}></div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div className="card animate-fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: "rgba(0, 112, 243, 0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>Información Sociodemográfica</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted-light)" }}>{progresoSocio}% completado</span>
                  <span style={{ color: "var(--text-muted-light)" }}>
                    {completadoSocio} de {totalPreguntasSocio}
                  </span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progresoSocio}%` }}></div>
                </div>
              </div>
            </div>

            <div className="card animate-fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: "rgba(0, 200, 150, 0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="#00c896"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12c0 1.2-.4 2.3-1 3.3a11.5 11.5 0 0 1-7 7c-1 .6-2.1 1-3.3 1s-2.3-.4-3.3-1a11.5 11.5 0 0 1-7-7c-.6-1-.9-2.1-.9-3.3s.3-2.3.9-3.3a11.5 11.5 0 0 1 7-7c1-.6 2.1-1 3.3-1s2.3.4 3.3 1a11.5 11.5 0 0 1 7 7c.6 1 1 2.1 1 3.3"
                      stroke="#00c896"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>Test de Inteligencias Múltiples</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-muted-light)" }}>{progresoIntel}% completado</span>
                  <span style={{ color: "var(--text-muted-light)" }}>
                    {completadoIntel} de {totalPreguntasIntel}
                  </span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progresoIntel}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {progresoTotal === 100 && (
            <div
              className="card animate-fade-in"
              style={{
                background: "linear-gradient(135deg, rgba(0, 200, 150, 0.05) 0%, rgba(0, 112, 243, 0.05) 100%)",
                border: "1px solid rgba(0, 200, 150, 0.2)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    background: "linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "var(--secondary-color)",
                    marginBottom: "0.5rem",
                  }}
                >
                  ¡Cuestionario Completado!
                </h3>
                <p style={{ color: "var(--text-muted-light)" }}>
                  Has completado todas las secciones del cuestionario de orientación vocacional.
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 640 ? "column" : "row",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <button onClick={handleContinue} className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15.5 3H8.5C7.39543 3 6.5 3.89543 6.5 5V19C6.5 20.1046 7.39543 21 8.5 21H15.5C16.6046 21 17.5 20.1046 17.5 19V5C17.5 3.89543 16.6046 3 15.5 3Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M9.5 7H14.5M9.5 11H14.5M9.5 15H11.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            {progresoTotal === 100 ? "Revisar Cuestionario" : "Continuar Cuestionario"}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="16,17 21,12 16,7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
