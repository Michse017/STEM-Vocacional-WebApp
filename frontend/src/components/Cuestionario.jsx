import { useEffect, useState } from "react"
import { getCuestionario, saveCuestionario } from "../api"
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

export default function Cuestionario() {
  const [dimensions, setDimensions] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const navigate = useNavigate()

  const codigo_estudiante = localStorage.getItem("codigo_estudiante")

  useEffect(() => {
    if (!codigo_estudiante) {
      navigate("/login")
      return
    }
    getCuestionario(codigo_estudiante).then((res) => {
      if (res.success) {
        setDimensions(res.dimensions)
        const resp = {}
        const expanded = {}
        res.dimensions.forEach((dim) => {
          resp[dim.dimension] = {}
          expanded[dim.dimension] = false // Inicialmente todas cerradas
          dim.questions.forEach((q) => {
            resp[dim.dimension][q.variable] = q.value
          })
        })
        setRespuestas(resp)
        setExpandedSections(expanded)
      }
    })
  }, [codigo_estudiante, navigate])

  const toggleSection = (dimensionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [dimensionName]: !prev[dimensionName],
    }))
  }

  const handleChange = (dim, varName, value) => {
    setRespuestas((prev) => ({
      ...prev,
      [dim]: {
        ...prev[dim],
        [varName]: value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const payload = {}
    dimensions.forEach((dim) => {
      const table = dim.dimension.toLowerCase().replace(/[^\w]/g, "_")
      payload[table] = {}
      dim.questions.forEach((q) => {
        if (typeof q.variable === "string") {
          payload[table][q.variable] = respuestas[dim.dimension]?.[q.variable] || ""
        } else if (Array.isArray(q.variable)) {
          q.variable.forEach((v) => {
            payload[table][v] = respuestas[dim.dimension]?.[v] || ""
          })
        }
      })
    })

    const res = await saveCuestionario(codigo_estudiante, payload)
    if (res.success) {
      setSuccess("¡Respuestas guardadas correctamente!")
      setTimeout(() => navigate("/dashboard"), 1200)
    } else {
      setError(res.message || "Error al guardar.")
    }
    setLoading(false)
  }

  const calculateProgress = () => {
    let totalQuestions = 0
    let answeredQuestions = 0

    dimensions.forEach((dim) => {
      dim.questions.forEach((q) => {
        totalQuestions++
        if (respuestas[dim.dimension]?.[q.variable]) {
          answeredQuestions++
        }
      })
    })

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  const progress = calculateProgress()

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f8ff 0%, #f0fff4 100%)",
        padding: "2rem 0",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
        {/* Header con botón de cerrar sesión */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#333", marginBottom: "0.5rem" }}>
              Cuestionario STEM
            </h1>
            <p style={{ color: "#666", margin: 0 }}>Estudiante: {codigo_estudiante}</p>
          </div>
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

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Completa todas las dimensiones para obtener tu perfil vocacional
          </p>
          <div style={{ maxWidth: "300px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.875rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}
            >
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0070f3, #00c896)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              marginBottom: "1.5rem",
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

        {success && (
          <div
            style={{
              padding: "1rem",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="22,4 12,14.01 9,11.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {dimensions.map((dim, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      padding: "0.5rem",
                      background: "#e3f2fd",
                      borderRadius: "8px",
                      color: "#0070f3",
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

              {/* Contenido desplegable */}
              {expandedSections[dim.dimension] && (
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {dim.questions.map((q, j) => (
                    <div key={j} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <label
                        style={{
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#374151",
                          lineHeight: "1.4",
                        }}
                      >
                        {q.text}
                      </label>

                      {q.type === "opcion_unica" && q.options ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                cursor: "pointer",
                                padding: "0.5rem",
                                borderRadius: "6px",
                                transition: "background-color 0.2s",
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <input
                                type="radio"
                                name={`q_${i}_${j}`}
                                value={opt}
                                checked={respuestas[dim.dimension]?.[q.variable] === opt}
                                onChange={() => handleChange(dim.dimension, q.variable, opt)}
                                style={{ margin: 0 }}
                              />
                              <span style={{ fontSize: "0.875rem", color: "#374151" }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : q.type === "numero" ? (
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={respuestas[dim.dimension]?.[q.variable] || ""}
                          onChange={(e) => handleChange(dim.dimension, q.variable, e.target.value)}
                          placeholder="0"
                          style={{
                            width: "120px",
                            padding: "0.5rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                        />
                      ) : (
                        <input
                          type="text"
                          value={respuestas[dim.dimension]?.[q.variable] || ""}
                          onChange={(e) => handleChange(dim.dimension, q.variable, e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem 3rem",
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
              {loading ? "Guardando..." : "Guardar Respuestas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
