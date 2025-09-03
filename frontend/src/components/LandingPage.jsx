import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f8ff 0%, #f0fff4 100%)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#0070f3",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                fontSize: "3rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #0070f3 0%, #00c896 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              STEM Vocational
            </h1>
          </div>
          <p
            style={{
              fontSize: "1.25rem",
              color: "#666",
              maxWidth: "48rem",
              margin: "0 auto 2rem auto",
              lineHeight: "1.6",
            }}
          >
            Plataforma de orientación vocacional para carreras STEM.
            <br />
            Descubre tu perfil y fortalezas para una mejor decisión profesional.
            <br />
            Responde nuestro cuestionario y visualiza tu avance en el panel de control.
          </p>
          <Link to="/login">
            <button
              style={{
                padding: "0.75rem 2rem",
                fontSize: "1.125rem",
                borderRadius: "8px",
                border: "none",
                background: "#0070f3",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseOver={(e) => (e.target.style.background = "#0051cc")}
              onMouseOut={(e) => (e.target.style.background = "#0070f3")}
            >
              Iniciar sesión
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginTop: "4rem",
          }}
        >
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 3H8.5C7.39543 3 6.5 3.89543 6.5 5V19C6.5 20.1046 7.39543 21 8.5 21H15.5C16.6046 21 17.5 20.1046 17.5 19V5C17.5 3.89543 16.6046 3 15.5 3Z" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 7H14.5" stroke="#0070f3" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9.5 11H14.5" stroke="#0070f3" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9.5 15H11.5" stroke="#0070f3" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              title: "Cuestionario Integral",
              desc: "Un solo formulario para recoger datos sociodemográficos, académicos y de habilidades.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L9 9H2L7 13L5 20L12 16L19 20L17 13L22 9H15L12 2Z" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8C14.2091 8 16 6.20914 16 4C16 1.79086 14.2091 0 12 0C9.79086 0 8 1.79086 8 4C8 6.20914 9.79086 8 12 8Z" transform="translate(0 14)" fill="#00c896"/>
                </svg>
              ),
              title: "Análisis de Inteligencias",
              desc: "Descubre tus fortalezas según la teoría de las Inteligencias Múltiples.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3v18h18" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 14l5-5 3 3 4-4" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              title: "Resultados Instantáneos",
              desc: "Visualiza tu inteligencia predominante y puntajes en un dashboard claro.",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 7L12 12" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7L12 12" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V12" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 4.5L17 9.5" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: "Orientación STEM",
              desc: "Usa tus resultados para explorar carreras en Ciencia, Tecnología, Ingeniería y Matemáticas.",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
              }}
            >
              <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>{item.icon}</div>
              <h3 style={{ fontWeight: "600", fontSize: "1.125rem", marginBottom: "0.5rem", color: "#333" }}>
                {item.title}
              </h3>
              <p style={{ color: "#666", fontSize: "0.875rem", lineHeight: "1.4" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
