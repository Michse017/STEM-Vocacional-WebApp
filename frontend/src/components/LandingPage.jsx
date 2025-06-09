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
                  <path
                    d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.04 0 2.04.18 2.97.5"
                    stroke="#0070f3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01l-3-3"
                    stroke="#0070f3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Dimensión Cognitiva",
              desc: "Evalúa tus habilidades de pensamiento y procesamiento",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="#00c896"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="#00c896"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="#00c896"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Educativa/Familiar",
              desc: "Analiza tu entorno educativo y familiar",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3v18h18" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"
                    stroke="#0070f3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Socioeconómico",
              desc: "Considera factores socioeconómicos relevantes",
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 12h-4l-3 9L9 3l-3 9H2"
                    stroke="#00c896"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Autoeficacia",
              desc: "Mide tu confianza en tus capacidades",
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
