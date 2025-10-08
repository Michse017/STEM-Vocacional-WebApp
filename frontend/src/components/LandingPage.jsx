import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.body.classList.toggle("dark-mode")
  }

  // No redirige automáticamente: el landing siempre es el punto de entrada.
  // Si existe una sesión activa de estudiante en esta ventana, sólo sincroniza el usuario mínimo para esta pestaña.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('active_session') || 'null')
      if (s && s.type === 'student' && s.code) {
        const existing = JSON.parse(sessionStorage.getItem('usuario') || 'null')
        if (!existing || !existing.id_usuario) {
          const minimal = { codigo_estudiante: s.code, id_usuario: -1 }
          try { sessionStorage.setItem('usuario', JSON.stringify(minimal)) } catch {}
        }
      }
    } catch (_) {}
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
        position: "relative",
      }}
    >
      <button onClick={toggleDarkMode} className="dark-mode-toggle" aria-label="Toggle dark mode">
        {darkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </button>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1rem" }}>
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
                boxShadow: "0 4px 12px rgba(0, 112, 243, 0.3)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 10v6M2 10l10-5 10 5-10 5z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 12v5c3 3 9 3 12 0v-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: "bold",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              STEM Vocational
            </h1>
          </div>

          <div style={{ maxWidth: "64rem", margin: "0 auto 2rem", lineHeight: "1.6" }}>
            <p style={{ fontSize: "1.25rem", color: "var(--text-muted-light)", marginBottom: "1rem" }}>
              Plataforma de orientación vocacional para carreras STEM.
            </p>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted-light)", marginBottom: "1rem" }}>
              Descubre tu perfil y fortalezas para una mejor decisión profesional.
            </p>
            <p style={{ fontSize: "1rem", color: "var(--text-muted-light)" }}>
              Responde nuestro cuestionario y visualiza tu avance en el panel de control.
            </p>
          </div>

          <Link to="/login" className="btn btn-primary" style={{ fontSize: "1.125rem", padding: "1rem 2rem" }}>
            Iniciar sesión
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginTop: "4rem",
          }}
        >
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15.5 3H8.5C7.39543 3 6.5 3.89543 6.5 5V19C6.5 20.1046 7.39543 21 8.5 21H15.5C16.6046 21 17.5 20.1046 17.5 19V5C17.5 3.89543 16.6046 3 15.5 3Z"
                    stroke="#0070f3"
                    strokeWidth="2"
                  />
                  <path d="M9.5 7H14.5M9.5 11H14.5M9.5 15H11.5" stroke="#0070f3" strokeWidth="2" />
                </svg>
              ),
              title: "Cuestionario Integral",
              desc: "Un solo formulario para recoger datos sociodemográficos, académicos y de habilidades.",
              color: "blue",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              ),
              title: "Análisis de Inteligencias",
              desc: "Descubre tus fortalezas según la teoría de las Inteligencias Múltiples.",
              color: "green",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3v18h18" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M7 14l5-5 3 3 4-4"
                    stroke="#0070f3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Resultados Instantáneos",
              desc: "Visualiza tu inteligencia predominante y puntajes en un dashboard claro.",
              color: "blue",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#00c896" strokeWidth="2" />
                  <path d="M2 7L12 12M22 7L12 12M12 22V12" stroke="#00c896" strokeWidth="2" />
                </svg>
              ),
              title: "Orientación STEM",
              desc: "Usa tus resultados para explorar carreras en Ciencia, Tecnología, Ingeniería y Matemáticas.",
              color: "green",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="card animate-fade-in"
              style={{
                textAlign: "center",
                animationDelay: `${index * 0.1}s`,
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  backgroundColor: item.color === "blue" ? "rgba(0, 112, 243, 0.1)" : "rgba(0, 200, 150, 0.1)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  transition: "transform 0.3s ease",
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>{item.title}</h3>
              <p style={{ color: "var(--text-muted-light)", lineHeight: "1.6" }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-in" style={{ textAlign: "center", marginTop: "5rem" }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(0, 112, 243, 0.05) 0%, rgba(0, 200, 150, 0.05) 100%)",
              border: "1px solid rgba(0, 112, 243, 0.2)",
              maxWidth: "32rem",
              margin: "0 auto",
            }}
          >
            <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1rem" }}>
              ¿Listo para descubrir tu futuro?
            </h2>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted-light)", marginBottom: "1.5rem" }}>
              Comienza tu viaje de autodescubrimiento y encuentra la carrera STEM perfecta para ti.
            </p>
            <Link to="/login" className="btn btn-primary">
              Comenzar ahora
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
