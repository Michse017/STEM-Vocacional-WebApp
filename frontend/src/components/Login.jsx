import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { checkUsuario, setupCredenciales, loginConPassword } from "../api"
import { api as adminApi } from "../admin/api"


export default function Login() {
  const [searchParams] = useSearchParams()
  const [codigoEstudiante, setCodigoEstudiante] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(searchParams.get('admin') === 'true')
  const [adminPassword, setAdminPassword] = useState("")
  // Student credential state
  const [studentPhase, setStudentPhase] = useState('code') // code | setup | password
  const [username, setUsername] = useState("")
  const [studentPassword, setStudentPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState(null)

  // Detecta si debe mostrar el formulario de admin desde el parámetro URL
  useEffect(() => {
    const adminParam = searchParams.get('admin')
    if (adminParam === 'true') {
      setIsAdmin(true)
    }
  }, [searchParams])

  // Si ya hay sesión activa, redirige de inmediato al destino correcto (estudiante → dashboard, admin → admin)
  useEffect(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('usuario') || 'null')
      const s = JSON.parse(localStorage.getItem('active_session') || 'null')
      if (u && u.id_usuario) {
        // Sesión de estudiante (sessionStorage)
        navigate('/dashboard', { replace: true })
        return
      }
      if (s) {
        setActiveSession(s)
        if (s.type === 'student' && s.code) {
          // Garantiza que Dashboard tenga usuario mínimo en esta pestaña
          const existing = JSON.parse(sessionStorage.getItem('usuario') || 'null')
          if (!existing || !existing.id_usuario) {
            try { sessionStorage.setItem('usuario', JSON.stringify({ codigo_estudiante: s.code, id_usuario: -1 })) } catch {}
          }
          navigate('/dashboard', { replace: true })
          return
        }
        if (s.type === 'admin') {
          navigate('/admin', { replace: true })
          return
        }
      }
    } catch (_) {}
  }, [navigate])

  // Sincroniza entre pestañas para bloquear múltiples inicios en paralelo
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'active_session') {
        try { setActiveSession(JSON.parse(e.newValue)); } catch { setActiveSession(null) }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!codigoEstudiante.trim()) {
      setError(isAdmin ? "Por favor, ingresa tu usuario (código)." : "Por favor, ingresa tu código de estudiante.")
      return
    }
    setLoading(true)
    setError("")

    try {
      // Si hay sesión activa, redirige directo (UX simple y coherente)
      const current = JSON.parse(localStorage.getItem('active_session') || 'null')
      if (current?.type === 'student' && current.code) {
        // Sincroniza sesión mínima y navega
        const existing = JSON.parse(sessionStorage.getItem('usuario') || 'null')
        if (!existing || !existing.id_usuario) {
          try { sessionStorage.setItem('usuario', JSON.stringify({ codigo_estudiante: current.code, id_usuario: -1 })) } catch {}
        }
        navigate('/dashboard', { replace: true })
        return
      }
      if (current?.type === 'admin') {
        navigate('/admin', { replace: true })
        return
      }
      if (isAdmin) {
        // Admin login via JWT
        if (!adminPassword.trim()) throw new Error("Por favor, ingresa tu contraseña.")
        console.log('[Admin Login] Intentando login con:', codigoEstudiante)
        const res = await adminApi('/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigoEstudiante, password: adminPassword })
        })
        console.log('[Admin Login] Respuesta:', res)
        if (res?.access_token) {
          try { localStorage.setItem('admin_token', res.access_token) } catch (_) {}
          try { localStorage.setItem('active_session', JSON.stringify({ type: 'admin', at: Date.now() })) } catch (_) {}
          navigate('/admin', { replace: true })
          return
        }
        throw new Error("No se pudo iniciar sesión como administrador.")
      } else {
        if (studentPhase === 'code') {
          const info = await checkUsuario(codigoEstudiante)
          if (info?.error === 'not_found') {
            throw new Error('El código ingresado no está registrado.')
          }
          if (info?.status === 'needs_setup') {
            setStudentPhase('setup')
            setError('')
            setSuccess('')
          } else if (info?.status === 'needs_password') {
            setStudentPhase('password')
            setUsername(info?.username || '')
            setError('')
            setSuccess('')
          } else {
            throw new Error('Respuesta inesperada del servidor.')
          }
          setLoading(false)
          return
        }
        if (studentPhase === 'setup') {
          if (!username.trim() || !studentPassword.trim() || !confirm.trim()) {
            throw new Error('Completa usuario, contraseña y confirmación.')
          }
          await setupCredenciales({ codigoEstudiante, username: username.trim().toLowerCase(), password: studentPassword, confirm })
          setStudentPhase('password')
          setSuccess('Credenciales creadas. Ingresa tu contraseña para continuar.')
          setError('')
          setLoading(false)
          return
        }
        if (studentPhase === 'password') {
          const usuario = await loginConPassword({ codigoEstudiante, password: studentPassword })
          if (!usuario || !usuario.id_usuario) {
            throw new Error('No se pudo iniciar sesión.')
          }
          try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
          try { localStorage.setItem('active_session', JSON.stringify({ type: 'student', code: usuario.codigo_estudiante, at: Date.now() })) } catch (_) {}
          navigate('/dashboard', { replace: true })
          return
        }
      }
    } catch (err) {
      // Mensajes claros para códigos inexistentes y errores de contraseña
      let msg = String(err.message || "Ocurrió un error al iniciar sesión.")
      const lower = msg.toLowerCase()
      if (lower.includes('invalid_password_format')) {
        msg = 'La contraseña debe tener entre 8 y 64 caracteres y solo letras (A–Z, a–z) y números (0–9).'
      } else if (lower.includes('password_too_long')) {
        msg = 'La contraseña es demasiado larga o contiene caracteres no compatibles. Usa 8 a 64 caracteres con letras y números.'
      } else if (lower.includes('password_hash_error')) {
        msg = 'No se pudo procesar la contraseña. Prueba con otra (letras y números), y evita emojis o caracteres inusuales.'
      } else if (lower.includes('weak_password')) {
        msg = 'La contraseña es muy corta. Debe tener al menos 8 caracteres.'
      }
      if (!codigoEstudiante.trim()) {
        setError(isAdmin ? "Por favor, ingresa tu usuario (código)." : "Por favor, ingresa tu código de estudiante.")
      } else if (!isAdmin && (msg.toLowerCase().includes('no está registrado') || msg.includes('404'))) {
        setError('El código ingresado no está registrado. Verifica e intenta nuevamente.')
      } else {
        setError(msg)
      }
      setSuccess('')
      setLoading(false)
    }
  }
  // UI helper: si hay una sesión activa, muestra aviso y botón para "Cambiar usuario" (limpia sesión)
  const renderActiveSessionBanner = () => {
    if (!activeSession) return null
    const msg = activeSession.type === 'admin'
      ? 'Sesión de administrador activa en esta ventana.'
      : `Sesión activa: ${activeSession.code}.`
    return (
      <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>
        {msg}
        {activeSession.type === 'admin' && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: 8 }}
            onClick={() => {
              // Permite ir al panel admin de forma explícita, no automática
              navigate('/admin');
            }}
          >
            Ir a Admin
          </button>
        )}
        <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => {
          try { sessionStorage.removeItem('usuario') } catch {}
          try { localStorage.removeItem('admin_token') } catch {}
          try { localStorage.removeItem('active_session') } catch {}
          setActiveSession(null)
          setError('')
          setSuccess('')
        }}>Cambiar usuario</button>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
      }}
    >
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "28rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 4px 12px rgba(0, 112, 243, 0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{isAdmin ? 'Acceso Administrador' : 'Bienvenido'}</h2>
          <p style={{ color: "var(--text-muted-light)", fontSize: "1rem" }}>
            {isAdmin ? 'Ingresa tus credenciales de administrador' : 'Ingresa tu código de estudiante para comenzar'}
          </p>
        </div>

  {renderActiveSessionBanner()}
  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-light)",
              }}
            >
              {isAdmin ? 'Admin (código)' : 'Código de estudiante'}
            </label>
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted-light)",
                  pointerEvents: "none",
                }}
                width="20"
                height="20"
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
                value={codigoEstudiante}
                onChange={(e) => setCodigoEstudiante(e.target.value)}
                placeholder={isAdmin ? 'ej: admin' : 'Ej: 000123456'}
                className="form-control"
                style={{ paddingLeft: "3rem" }}
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  color: "var(--text-light)",
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="form-control"
              />
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {success}
            </div>
          )}

          {/* Submit button (for code/admin/password phases). For setup phase we render this below the fields. */}
          {!( !isAdmin && (studentPhase === 'setup' || studentPhase === 'password')) && (
            <button
              type="submit"
              disabled={loading}
              className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  {isAdmin ? 'Ingresando...' : 'Validando...'}
                </>
              ) : (
                <>
                  {isAdmin ? 'Entrar' : (studentPhase === 'code' ? 'Validar código' : 'Continuar')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          )}

          {/* Student credential inputs depending on phase */}
          {!isAdmin && studentPhase === 'setup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-light)' }}>Nombre de usuario</label>
                <input type="text" className="form-control" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="ej: test-001" />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-light)' }}>Contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={studentPassword}
                  onChange={(e)=>setStudentPassword(e.target.value)}
                  minLength={8}
                  maxLength={64}
                  pattern="[A-Za-z0-9]{8,64}"
                  title="Usa 8 a 64 caracteres: solo letras (A-Z, a-z) y números (0-9)."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 8, top: 36, background: 'transparent', border: 'none', color: 'var(--text-muted-light)', cursor: 'pointer' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
                <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted-light)' }}>
                  Requisitos: 8 a 64 caracteres. Solo letras (A–Z, a–z) y números (0–9).
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-light)' }}>Confirmar contraseña</label>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  value={confirm}
                  onChange={(e)=>setConfirm(e.target.value)}
                  minLength={8}
                  maxLength={64}
                  pattern="[A-Za-z0-9]{8,64}"
                  title="Usa 8 a 64 caracteres: solo letras (A-Z, a-z) y números (0-9)."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 8, top: 36, background: 'transparent', border: 'none', color: 'var(--text-muted-light)', cursor: 'pointer' }}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
                style={{ width: "100%" }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {'Creando credenciales...'}
                  </>
                ) : (
                  <>
                    {'Crear credenciales'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {!isAdmin && studentPhase === 'password' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-light)' }}>Contraseña</label>
              <input type="password" className="form-control" value={studentPassword} onChange={(e)=>setStudentPassword(e.target.value)} />
              <button
                type="submit"
                disabled={loading}
                className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
                style={{ width: "100%", marginTop: '0.75rem' }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {'Ingresando...'}
                  </>
                ) : (
                  <>
                    {'Ingresar'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 14 }}>
            {isAdmin ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsAdmin(false); setError(""); setAdminPassword(""); setStudentPhase('code'); setStudentPassword(''); setUsername(''); setConfirm(''); }}
              >
                Soy estudiante
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsAdmin(true); setError(""); setStudentPhase('code'); setStudentPassword(''); setUsername(''); setConfirm(''); }}
              >
                Soy administrador
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
