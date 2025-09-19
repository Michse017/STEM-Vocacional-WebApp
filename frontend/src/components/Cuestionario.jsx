import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { enviarCuestionario, enviarCuestionarioKeepAlive, finalizarCuestionario } from "../api"
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
  const [finalizado, setFinalizado] = useState(respuestasPrevias?.finalizado || usuario?.finalizado || false)

  const [formData, setFormData] = useState({
    sociodemografica: {},
    inteligencias_multiples: {},
  })

  const [openSection, setOpenSection] = useState(secciones[0]?.id || null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const today = new Date().toISOString().slice(0, 10)

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
      // Mapear valores numéricos a las opciones de los selects
      const mapMiembrosHogar = (v) => {
        if (v === null || v === undefined || v === "") return ""
        const n = parseInt(v, 10)
        if (!Number.isFinite(n)) return v // ya puede venir como "2-3"
        if (n >= 6) return "6 o más"
        if (n >= 4) return "4-5"
        if (n >= 2) return "2-3"
        return "" // no hay opción para 0 o 1 en el UI
      }
      const mapNumeroHermanos = (v) => {
        if (v === null || v === undefined || v === "") return ""
        const n = parseInt(v, 10)
        if (!Number.isFinite(n)) return v // ya puede venir como "2-3"
        if (n === 0) return "Ninguno"
        if (n === 1) return "1"
        if (n >= 4) return "4 o más"
        if (n >= 2) return "2-3"
        return ""
      }
      if (socioData.miembros_hogar !== undefined) {
        socioData.miembros_hogar = mapMiembrosHogar(socioData.miembros_hogar)
      }
      if (socioData.numero_hermanos !== undefined) {
        socioData.numero_hermanos = mapNumeroHermanos(socioData.numero_hermanos)
      }
      setFormData({
        sociodemografica: socioData,
        inteligencias_multiples: respuestasPrevias.inteligencias_multiples || {},
      })
      setFinalizado(respuestasPrevias.finalizado || usuario?.finalizado || false)
    }
  }, [usuario, respuestasPrevias, navigate])

  // Autosave al cerrar la pestaña o recargar: envía solo lo válido (el backend ya depura)
  useEffect(() => {
    if (!usuario || finalizado) return
    const handler = (e) => {
      const payload = {
        id_usuario: usuario.id_usuario,
        sociodemografica: formData.sociodemografica,
        inteligencias_multiples: formData.inteligencias_multiples,
      }
      // keepalive no bloquea el cierre. No prevenimos el unload para no molestar.
      enviarCuestionarioKeepAlive(payload)
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [usuario, finalizado, formData])

  const handleChange = (seccion, campo, valor) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [seccion]: {
          ...prev[seccion],
          [campo]: valor,
        },
      }
      // Autocalcular puntaje_global_saber11 si tenemos los 5 componentes
      if (seccion === 'sociodemografica') {
        const s = updated.sociodemografica
        const toInt = (x) => {
          const n = parseInt(x, 10)
          return Number.isFinite(n) ? n : null
        }
        const lc = toInt(s.puntaje_lectura_critica)
        const m  = toInt(s.puntaje_matematicas)
        const sc = toInt(s.puntaje_sociales_ciudadanas)
        const cn = toInt(s.puntaje_ciencias_naturales)
        const i  = toInt(s.puntaje_ingles)
        if ([lc, m, sc, cn, i].every((v) => v !== null)) {
          const ponderado = 3 * (lc + m + sc + cn) + i
          const indice = ponderado / 13
          const globalCalc = Math.round(indice * 5)
          updated.sociodemografica.puntaje_global_saber11 = String(globalCalc)
        }
      }
      return updated
    })
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
  setFieldErrors({})

    const cleanedSociodemografica = { ...formData.sociodemografica }
    // Convertir sólo valores numéricos válidos; si está vacío, no enviar el campo
    const asIntOrDelete = (obj, key) => {
      if (obj[key] === undefined) return
      const raw = obj[key]
      if (raw === "" || raw === null || raw === undefined) {
        delete obj[key]
        return
      }
      const n = parseInt(String(raw), 10)
      if (Number.isFinite(n)) obj[key] = n
      else delete obj[key]
    }
    ;[
      "puntaje_global_saber11",
      "puntaje_matematicas",
      "puntaje_lectura_critica",
      "puntaje_ciencias_naturales",
      "puntaje_sociales_ciudadanas",
      "puntaje_ingles",
    ].forEach((k) => asIntOrDelete(cleanedSociodemografica, k))

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
      if (resultado.errors) {
        setFieldErrors(resultado.errors)
      }
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

  const handleFinalizar = async () => {
    if (!usuario) return
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      // Enviar el estado actual del formulario al backend para guardar y luego finalizar
      const payload = {
        id_usuario: usuario.id_usuario,
        sociodemografica: formData.sociodemografica,
        inteligencias_multiples: formData.inteligencias_multiples,
      }
      const res = await finalizarCuestionario(usuario.id_usuario, payload)
      if (res.status === "success") {
        setFinalizado(true)
        setSuccess(res.message)
        setTimeout(() => {
          navigate("/dashboard", { state: { usuario: { ...usuario, finalizado: true }, respuestas: { ...formData, finalizado: true } } })
        }, 1200)
      } else {
        // Mostrar faltantes
        const faltantes = res.missing || {}
        const partes = Object.entries(faltantes).map(([sec, campos]) => `${sec}: ${campos.join(", ")}`)
        setError(res.message + (partes.length ? `\nFaltan: ${partes.join(" | ")}` : ""))
      }
    } catch (e) {
      setError(e.message || "No fue posible finalizar.")
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
            <div style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  if (usuario && !finalizado) {
                    const payload = {
                      id_usuario: usuario.id_usuario,
                      sociodemografica: formData.sociodemografica,
                      inteligencias_multiples: formData.inteligencias_multiples,
                    }
                    // Mejor esfuerzo; no bloqueamos la navegación
                    await enviarCuestionarioKeepAlive(payload)
                  }
                  navigate('/login')
                }}
              >
                Cerrar sesión
              </button>
            </div>
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
                              disabled={finalizado}
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
                              disabled={finalizado}
                              // UX: no permitir fechas futuras; y para graduación, mínimo 14 años después del nacimiento si lo tenemos
                              max={today}
                              min={(() => {
                                if (pregunta.id === 'fecha_graduacion_bachillerato' && formData.sociodemografica?.fecha_nacimiento) {
                                  const dob = new Date(formData.sociodemografica.fecha_nacimiento)
                                  if (!isNaN(dob)) {
                                    dob.setFullYear(dob.getFullYear() + 14)
                                    const y = dob.getFullYear()
                                    const m = String(dob.getMonth() + 1).padStart(2, '0')
                                    const d = String(dob.getDate()).padStart(2, '0')
                                    return `${y}-${m}-${d}`
                                  }
                                }
                                return undefined
                              })()}
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
                              disabled={finalizado}
                            />
                          )}

                          {/* Campos condicionales para 'Otro/a' */}
                          {seccion.id === 'sociodemografica' && pregunta.id === 'condicion_discapacidad' && formData.sociodemografica?.condicion_discapacidad === 'Otra' && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Describe la condición de discapacidad"
                                value={formData.sociodemografica?.otro_discapacidad || ''}
                                onChange={(e) => handleChange('sociodemografica', 'otro_discapacidad', e.target.value)}
                                className="form-control"
                                disabled={finalizado}
                              />
                            </div>
                          )}
                          {seccion.id === 'sociodemografica' && pregunta.id === 'grupo_etnico' && formData.sociodemografica?.grupo_etnico === 'Otro' && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Describe el grupo étnico"
                                value={formData.sociodemografica?.otro_grupo_etnico || ''}
                                onChange={(e) => handleChange('sociodemografica', 'otro_grupo_etnico', e.target.value)}
                                className="form-control"
                                disabled={finalizado}
                              />
                            </div>
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
                                  disabled={finalizado}
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
                                  disabled={finalizado}
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

            {fieldErrors && (fieldErrors.sociodemografica || fieldErrors.inteligencias_multiples) && (
              <div className="alert alert-error">
                {fieldErrors.sociodemografica && <div>Socio: {String(fieldErrors.sociodemografica)}</div>}
                {fieldErrors.inteligencias_multiples && <div>IM: {String(fieldErrors.inteligencias_multiples)}</div>}
              </div>
            )}

            {success && <div className="alert alert-success">✅ {success}</div>}

            {!finalizado ? (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn ${loading ? "btn-secondary" : "btn-success"}`}
                  style={{ width: "100%" }}
                >
                  {loading ? "⏳ Guardando..." : "✅ Guardar Progreso e Ir al Dashboard"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalizar}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                >
                  🏁 Finalizar Cuestionario
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={() => navigate("/dashboard", { state: { usuario: { ...usuario, finalizado: true }, respuestas: { ...formData, finalizado: true } } })}
              >
                ↩ Regresar al Dashboard
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
