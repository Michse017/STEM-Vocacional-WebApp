import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { enviarCuestionario } from "../api"
import { secciones } from "./cuestionarioConfig"

const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const day = String(date.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error al formatear la fecha:", dateString, error)
    return ""
  }
}

export default function Cuestionario() {
  const navigate = useNavigate()
  const location = useLocation()

  const { usuario, respuestas: respuestasPrevias } = location.state || {}

  const [formData, setFormData] = useState({
    sociodemografica: {},
    inteligencias_multiples: {},
  })

  const [openSection, setOpenSection] = useState(secciones[0]?.id || null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!usuario) {
      navigate("/login")
      return
    }
    if (respuestasPrevias) {
      const socioData = { ...(respuestasPrevias.sociodemografica || {}) }
      if (socioData.fecha_nacimiento) {
        socioData.fecha_nacimiento = formatDateToYYYYMMDD(socioData.fecha_nacimiento)
      }
      if (socioData.fecha_graduacion_bachillerato) {
        socioData.fecha_graduacion_bachillerato = formatDateToYYYYMMDD(socioData.fecha_graduacion_bachillerato)
      }
      setFormData({
        sociodemografica: socioData,
        inteligencias_multiples: respuestasPrevias.inteligencias_multiples || {},
      })
    }
  }, [usuario, respuestasPrevias, navigate])

  const handleChange = (seccion, campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor,
      },
    }))
  }

  const handleSectionNavigation = (direction) => {
    const currentIndex = secciones.findIndex((s) => s.id === openSection)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < secciones.length) {
      setOpenSection(secciones[nextIndex].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const cleanedSociodemografica = { ...formData.sociodemografica }
    const puntajes = [
      "puntaje_global_saber11",
      "puntaje_matematicas",
      "puntaje_lectura_critica",
      "puntaje_ciencias_naturales",
      "puntaje_competencias_ciudadanas",
      "puntaje_ingles",
    ]
    puntajes.forEach((puntaje) => {
      const value = cleanedSociodemografica[puntaje]
      cleanedSociodemografica[puntaje] = value === "" || value === null || isNaN(value) ? 0 : Number.parseInt(value, 10)
    })

    if (cleanedSociodemografica.fecha_nacimiento) {
      cleanedSociodemografica.fecha_nacimiento = formatDateToYYYYMMDD(cleanedSociodemografica.fecha_nacimiento)
    }
    if (cleanedSociodemografica.fecha_graduacion_bachillerato) {
      cleanedSociodemografica.fecha_graduacion_bachillerato = formatDateToYYYYMMDD(
        cleanedSociodemografica.fecha_graduacion_bachillerato,
      )
    }

    try {
      const payload = {
        id_usuario: usuario.id_usuario,
        sociodemografica: cleanedSociodemografica,
        inteligencias_multiples: formData.inteligencias_multiples,
      }

      const resultado = await enviarCuestionario(payload)
      setSuccess(resultado.message || "Respuestas guardadas con éxito.")

      setTimeout(() => {
        navigate("/dashboard", { state: { usuario, respuestas: payload } })
      }, 1500)
    } catch (err) {
      setError(err.message || "Error al guardar las respuestas.")
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) return <p>Cargando...</p>

  return (
    <div className="cuestionario-container">
      <div>
        <div className="card animate-fade-in">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1>Cuestionario de Orientación Vocacional</h1>
            <p>
              Hola,{" "}
              <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>{usuario.codigo_estudiante}</span>. Por
              favor, completa las siguientes secciones. Puedes guardar tu progreso en cualquier momento.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {secciones.map((seccion, index) => (
              <div key={seccion.id} className="accordion-section">
                <legend
                  onClick={() => setOpenSection(openSection === seccion.id ? null : seccion.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span>{seccion.titulo}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {index + 1} de {secciones.length}
                    </span>
                    <span
                      className="accordion-icon"
                      style={{
                        transform: openSection === seccion.id ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </legend>

                {openSection === seccion.id && (
                  <div className="fieldset-content">
                    {seccion.preguntas.map((pregunta) => (
                      <div key={pregunta.id} className="form-group">
                        {pregunta.tipo !== "vf" && <label>{pregunta.texto}</label>}

                        <div>
                          {pregunta.tipo === "select" && (
                            <select
                              value={formData[seccion.id]?.[pregunta.id] || ""}
                              onChange={(e) => handleChange(seccion.id, pregunta.id, e.target.value)}
                              className="form-control"
                            >
                              <option value="">Selecciona una opción</option>
                              {pregunta.opciones.map((opcion) => (
                                <option key={opcion.valor} value={opcion.valor}>
                                  {opcion.texto}
                                </option>
                              ))}
                            </select>
                          )}

                          {pregunta.tipo === "date" && (
                            <input
                              type="date"
                              value={formData[seccion.id]?.[pregunta.id] || ""}
                              onChange={(e) => handleChange(seccion.id, pregunta.id, e.target.value)}
                              className="form-control"
                            />
                          )}

                          {pregunta.tipo === "number" && (
                            <input
                              type="number"
                              value={formData[seccion.id]?.[pregunta.id] || ""}
                              onChange={(e) => handleChange(seccion.id, pregunta.id, e.target.value)}
                              min={pregunta.min}
                              max={pregunta.max}
                              className="form-control"
                            />
                          )}

                          {pregunta.tipo === "vf" && (
                            <div
                              style={{
                                padding: "1rem",
                                backgroundColor: "var(--surface)",
                                borderRadius: "8px",
                                marginBottom: "1rem",
                              }}
                            >
                              <p style={{ fontWeight: "500", marginBottom: "0.75rem" }}>{pregunta.texto}</p>
                              <div style={{ display: "flex", gap: "1.5rem" }}>
                                <label
                                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                                >
                                  <input
                                    type="radio"
                                    name={pregunta.id}
                                    value="V"
                                    checked={formData.inteligencias_multiples?.[pregunta.id] === "V"}
                                    onChange={(e) =>
                                      handleChange("inteligencias_multiples", pregunta.id, e.target.value)
                                    }
                                    style={{ accentColor: "var(--primary-color)" }}
                                  />
                                  <span>Verdadero</span>
                                </label>
                                <label
                                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                                >
                                  <input
                                    type="radio"
                                    name={pregunta.id}
                                    value="F"
                                    checked={formData.inteligencias_multiples?.[pregunta.id] === "F"}
                                    onChange={(e) =>
                                      handleChange("inteligencias_multiples", pregunta.id, e.target.value)
                                    }
                                    style={{ accentColor: "var(--primary-color)" }}
                                  />
                                  <span>Falso</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "1.5rem",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSectionNavigation(-1)}
                        disabled={index === 0}
                        className="btn btn-secondary"
                        style={{
                          opacity: index === 0 ? "0.5" : "1",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSectionNavigation(1)}
                        disabled={index === secciones.length - 1}
                        className="btn btn-primary"
                        style={{
                          opacity: index === secciones.length - 1 ? "0.5" : "1",
                          cursor: index === secciones.length - 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            {success && <div className="alert alert-success">✅ {success}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`btn ${loading ? "btn-secondary" : "btn-success"}`}
              style={{ width: "100%" }}
            >
              {loading ? "⏳ Guardando..." : "✅ Guardar Progreso e Ir al Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
