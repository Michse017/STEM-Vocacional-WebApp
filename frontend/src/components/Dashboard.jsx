import { useEffect, useState } from "react"
import { getDashboard } from "../api"
import { useNavigate } from "react-router-dom"

const dimensionIcons = {
  Cognitivo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.04 0 2.04.18 2.97.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 4L12 14.01l-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "Educativa/Familiar": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Socioeconómico: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Autoeficacia: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

const dimensionColors = {
  Cognitivo: { bg: "#e3f2fd", text: "#1565c0" },
  "Educativa/Familiar": { bg: "#e8f5e8", text: "#2e7d32" },
  Socioeconómico: { bg: "#f3e5f5", text: "#7b1fa2" },
  Autoeficacia: { bg: "#fff3e0", text: "#ef6c00" },
}

export default function Dashboard() {
  const [dimensions, setDimensions] = useState([])
  const [codigo, setCodigo] = useState("")
  const [expandedSections, setExpandedSections] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const codigo_estudiante = localStorage.getItem("codigo_estudiante")
    if (!codigo_estudiante) {
      navigate("/login")
      return
    }
    setCodigo(codigo_estudiante)
    getDashboard(codigo_estudiante).then((res) => {
      if (res.success) {
        setDimensions(res.dimensions)
        // Inicializar todas las secciones como cerradas
        const expanded = {}
        res.dimensions.forEach((dim) => {
          expanded[dim.dimension] = false
        })
        setExpandedSections(expanded)
      }
    })
  }, [navigate])

  const toggleSection = (dimensionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [dimensionName]: !prev[dimensionName],
    }))
  }

  const getCompletionStatus = (dim) => {
    const totalQuestions = dim.questions.length
    const answeredQuestions = dim.questions.filter(
      (q) => q.value !== "" && q.value !== null && q.value !== undefined,
    ).length
    return { answered: answeredQuestions, total: totalQuestions }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f8ff 0%, #f0fff4 100%)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            alignItems: window.innerWidth < 768 ? "flex-start" : "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                padding: "0.5rem",
                background: "#e3f2fd",
                borderRadius: "8px",
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
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#333", margin: 0 }}>Panel de Control</h1>
              <p style={{ color: "#666", margin: 0 }}>Estudiante: {codigo}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/cuestionario")}
              style={{
                padding: "0.5rem 1rem",
                background: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#0051cc")}
              onMouseOut={(e) => (e.target.style.background = "#0070f3")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Editar Cuestionario
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                navigate("/")
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "white",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#fef2f2")}
              onMouseOut={(e) => (e.target.style.background = "white")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {/* Info Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #0070f3 0%, #00c896 100%)",
            color: "white",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                Cuestionario STEM Vocacional
              </h2>
              <p style={{ opacity: 0.9, marginBottom: "1rem", lineHeight: "1.5" }}>
                Este cuestionario evalúa tu perfil vocacional a través de 4 dimensiones clave para carreras STEM:
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "1rem",
                }}
              >
                {[
                  { icon: dimensionIcons.Cognitivo, name: "Cognitivo" },
                  { icon: dimensionIcons["Educativa/Familiar"], name: "Educativa/Familiar" },
                  { icon: dimensionIcons.Socioeconómico, name: "Socioeconómico" },
                  { icon: dimensionIcons.Autoeficacia, name: "Autoeficacia" },
                ].map((item, index) => (
                  <div key={index} style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "center", color: "white" }}>
                      {item.icon}
                    </div>
                    <p style={{ fontSize: "0.875rem", fontWeight: "500", margin: 0 }}>{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {dimensions.map((dim, i) => {
            const status = getCompletionStatus(dim)
            const colors = dimensionColors[dim.dimension] || { bg: "#f3f4f6", text: "#374151" }

            return (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                {/* Header desplegable */}
                <div
                  onClick={() => toggleSection(dim.dimension)}
                  style={{
                    padding: "1.5rem",
                    borderBottom: expandedSections[dim.dimension] ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          padding: "0.5rem",
                          background: "#f3f4f6",
                          borderRadius: "8px",
                          color: "#666",
                        }}
                      >
                        {dimensionIcons[dim.dimension] || dimensionIcons.Cognitivo}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#333", margin: 0 }}>
                          {dim.dimension}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                          {dim.questions.length} pregunta{dim.questions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          padding: "0.25rem 0.75rem",
                          background: colors.bg,
                          color: colors.text,
                          borderRadius: "12px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                        }}
                      >
                        {status.answered}/{status.total}
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform: expandedSections[dim.dimension] ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                          color: "#666",
                        }}
                      >
                        <polyline
                          points="6,9 12,15 18,9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Contenido desplegable */}
                {expandedSections[dim.dimension] && (
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {dim.questions.map((q, j) => (
                      <div
                        key={j}
                        style={{
                          borderLeft: "4px solid #e5e7eb",
                          paddingLeft: "1rem",
                          paddingTop: "0.5rem",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#374151",
                            fontSize: "0.875rem",
                            marginBottom: "0.25rem",
                            lineHeight: "1.4",
                          }}
                        >
                          {q.text}
                        </p>
                        <div style={{ fontSize: "0.875rem" }}>
                          {q.value !== "" && q.value !== null && q.value !== undefined ? (
                            <span
                              style={{
                                color: "#333",
                                background: "#f3f4f6",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                display: "inline-block",
                              }}
                            >
                              {q.value}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin respuesta</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
