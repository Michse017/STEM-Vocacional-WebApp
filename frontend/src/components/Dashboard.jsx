import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getDynamicOverview } from "../api"

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  let { usuario } = location.state || {}
  // Persist and recover usuario from sessionStorage
  if (!usuario) {
    try { const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); if (u && u.id_usuario) usuario = u; } catch (_) {}
  } else {
    try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
  }
  // Ensure active_session is set when landing here with a student
  useEffect(() => {
    if (usuario?.codigo_estudiante) {
      try {
        const s = JSON.parse(localStorage.getItem('active_session') || 'null');
        if (!s || s.type !== 'student') {
          localStorage.setItem('active_session', JSON.stringify({ type: 'student', code: usuario.codigo_estudiante, at: Date.now() }))
        }
      } catch (_) {}
    }
  }, [usuario?.codigo_estudiante])

  const [primary, setPrimary] = useState({ loading: true, data: null, user: null, error: "" })
  const [dynWithUser, setDynWithUser] = useState({ items: [], loading: true, error: "" })
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const ov = await getDynamicOverview(usuario?.codigo_estudiante || '')
        if (!mounted) return
        setPrimary({ loading: false, data: ov?.primary?.questionnaire || null, user: ov?.primary?.user || null, error: "" })
        setDynWithUser({ items: ov?.items || [], loading: false, error: "" })
      } catch (e) {
        if (mounted) {
          setPrimary({ loading: false, data: null, user: null, error: e.message || '' })
          setDynWithUser({ items: [], loading: false, error: e.message || '' })
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [usuario?.codigo_estudiante])

  const handleLogout = () => {
    try { sessionStorage.removeItem('usuario'); } catch (_) {}
    try { localStorage.removeItem('active_session'); } catch (_) {}
    navigate("/login", { replace: true })
  }

  if (!usuario) {
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

  // If primary dynamic questionnaire exists, prefer dynamic-first UI and hide legacy progress blocks
  const hasPrimary = Boolean(primary.data)
  const primaryTotal = hasPrimary ? (primary.data.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0) : 0
  const primaryAnswered = hasPrimary ? (primary.user?.answers ? Object.keys(primary.user.answers).length : 0) : 0
  const primaryStatus = primary.user?.status
  const primaryProgressCalc = hasPrimary && primaryTotal > 0 ? Math.min(100, Math.round((primaryAnswered / primaryTotal) * 100)) : 0
  const primaryProgress = primaryStatus === 'finalized' ? 100 : primaryProgressCalc

  // We are removing the general progress card per request; keep calculations local for future if needed

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

        {/* Cuestionario principal destacado (mostrar debajo del título) */}
        {primary.loading ? (
          <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            <div style={{height: '64px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted-light)'}}>
              Cargando cuestionario principal…
            </div>
          </div>
        ) : primary.data ? (
          <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', border: '1px solid rgba(0,112,243,0.2)', background: 'linear-gradient(180deg, rgba(0,112,243,0.04), rgba(0,200,150,0.03))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary">Principal</span>
                <span style={{ color: 'var(--text-muted-light)', fontSize: '0.9rem' }}>Te recomendamos completar este cuestionario primero.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{primary.data.title || primary.data.code}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Código: {primary.data.code}</div>
                  {primary.user?.status && (
                    <div style={{ marginTop: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estado: {primary.user.status}</div>
                  )}
                  {hasPrimary && (
                    <div style={{ marginTop: 6, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Progreso: {primaryProgress}% ({primaryAnswered} de {primaryTotal})
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/dynamic/${encodeURIComponent(primary.data.code)}`, { state: { usuario }, replace: false })}
                >
                  {(() => {
                    const st = primary.user?.status
                    if (st === 'finalized') return 'Revisar'
                    const answers = primary.user?.answers || {}
                    const answeredCount = typeof answers === 'object' ? Object.keys(answers).length : 0
                    if (st === 'in_progress' || answeredCount > 0) return 'Continuar'
                    return 'Responder'
                  })()}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Mensaje de finalizado del principal */}
        {hasPrimary && primary.user?.status === 'finalized' && (
          <div
            className="card animate-fade-in"
            style={{
              background: "linear-gradient(135deg, rgba(0, 200, 150, 0.05) 0%, rgba(0, 112, 243, 0.05) 100%)",
              border: "1px solid rgba(0, 200, 150, 0.2)",
              marginBottom: "1.5rem"
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
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--secondary-color)", marginBottom: "0.5rem" }}>¡Cuestionario Completado!</h3>
              <p style={{ color: "var(--text-muted-light)" }}>Has completado el cuestionario principal de orientación vocacional.</p>
            </div>
          </div>
        )}

        <div className="animate-fade-in" style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={() => navigate('/dynamic', { state: { usuario } })}
            className="btn btn-secondary"
            title="Ver cuestionarios dinámicos publicados"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Cuestionarios Disponibles
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

        <div className="animate-fade-in" style={{ marginTop: "2rem" }}>
          <div className="card" style={{ padding: "1rem" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>Cuestionarios Disponibles</h2>
            {dynWithUser.loading ? (
              <p>Cargando...</p>
            ) : dynWithUser.error ? (
              <p style={{ color: "crimson" }}>{dynWithUser.error}</p>
            ) : dynWithUser.items.length === 0 ? (
              <p>No hay cuestionarios disponibles.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
                {dynWithUser.items.map((i) => {
                  const status = i?.status || 'new'
                  const progress = i?.progress_percent ?? 0
                  const actionLabel = status === 'finalized' ? 'Revisar' : (progress > 0 ? 'Continuar' : 'Responder')
                  return (
                    <li key={i.code} className="card" style={{ padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{i.title || i.code}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Código: {i.code} · Estado: {status} · Progreso: {progress}%{i?.finalized_at ? ` · Finalizado: ${new Date(i.finalized_at).toLocaleString()}` : ''}</div>
                        <div className="progress-container" style={{ marginTop: 6 }}><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/dynamic/${encodeURIComponent(i.code)}`, { state: { usuario } })}
                      >
                        {actionLabel}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Historial de cuestionarios finalizados */}
        {dynWithUser.items.some(i => i.status === 'finalized') && (
          <div className="animate-fade-in" style={{ marginTop: "1rem" }}>
            <div className="card" style={{ padding: "1rem" }}>
              <h2 style={{ marginBottom: "0.75rem" }}>Historial de finalizados</h2>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
                {dynWithUser.items.filter(i => i.status === 'finalized').sort((a,b) => {
                  const da = a.finalized_at ? new Date(a.finalized_at).getTime() : 0;
                  const db = b.finalized_at ? new Date(b.finalized_at).getTime() : 0;
                  return db - da;
                }).map(i => (
                  <li key={i.code} className="card" style={{ padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.title || i.code}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        Finalizado: {i.finalized_at ? new Date(i.finalized_at).toLocaleString() : '—'}
                      </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate(`/dynamic/${encodeURIComponent(i.code)}`, { state: { usuario } })}>Revisar</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
