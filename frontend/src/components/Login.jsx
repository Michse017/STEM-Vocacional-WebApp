import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { checkUsuario, setupCredenciales, loginConPassword } from "../api"
import { api as adminApi } from "../admin/api"
import styled, { keyframes } from "styled-components"
import { GraduationCap, Eye, EyeOff, User, Lock, Loader } from "lucide-react"

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

// Styled Components
const Background = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
`

const FloatingElement = styled.div`
  position: absolute;
  opacity: 0.15;
  animation: ${float} ${(props) => props.duration || "6s"} ease-in-out infinite;
  animation-delay: ${(props) => props.delay || "0s"};
  color: ${(props) => props.color || "#8B5CF6"};
`

const Card = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5);
  padding: 2.5rem;
  width: 100%;
  max-width: 28rem;
  position: relative;
  z-index: 10;
  animation: ${fadeIn} 0.5s ease-out;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  border-radius: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  
  svg {
    color: white;
    width: 2rem;
    height: 2rem;
  }
`

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
`

const Description = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: ${(props) => (props.$hasIcon ? "3rem" : "1rem")};
  padding-right: ${(props) => (props.$hasToggle ? "3rem" : "1rem")};
  border: 2px solid transparent;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #8B5CF6;
    background: white;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

const ToggleButton = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: #8B5CF6;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const SpinnerIcon = styled(Loader)`
  animation: ${spin} 1s linear infinite;
`

const Message = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  animation: ${fadeIn} 0.3s ease-out;
  
  ${(props) =>
    props.$type === "error" &&
    `
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  `}
  
  ${(props) =>
    props.$type === "success" &&
    `
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  `}
`

const SessionBanner = styled.div`
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`

const SessionText = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`

const SessionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const SessionButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

const Footer = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`

const ModeToggleButton = styled.button`
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
  }
`

const HintText = styled.div`
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #6b7280;
`


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
      <SessionBanner>
        <SessionText>{msg}</SessionText>
        <SessionButtons>
          {activeSession.type === 'admin' && (
            <SessionButton
              type="button"
              onClick={() => navigate('/admin')}
            >
              Ir a Admin
            </SessionButton>
          )}
          <SessionButton
            type="button"
            onClick={() => {
              try { sessionStorage.removeItem('usuario') } catch {}
              try { localStorage.removeItem('admin_token') } catch {}
              try { localStorage.removeItem('active_session') } catch {}
              setActiveSession(null)
              setError('')
              setSuccess('')
            }}
          >
            Cambiar usuario
          </SessionButton>
        </SessionButtons>
      </SessionBanner>
    )
  }

  return (
    <Background>
      {/* Floating decorative elements */}
      <FloatingElement style={{ top: "10%", left: "10%" }} duration="7s" color="#8B5CF6">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="20" />
          <line x1="4" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="20" y2="12" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ top: "20%", right: "15%" }} duration="5s" delay="1s" color="#3B82F6">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: "15%", left: "15%" }} duration="6s" delay="2s" color="#10B981">
        <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: "20%", right: "10%" }} duration="8s" delay="0.5s" color="#F59E0B">
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </FloatingElement>

      <Card>
        <Header>
          <IconWrapper>
            <GraduationCap />
          </IconWrapper>
          <Title>OrientaSTEM</Title>
          <Description>{isAdmin ? "Acceso para administradores" : "Acceso para estudiantes"}</Description>
        </Header>

        {renderActiveSessionBanner()}

        {error && <Message $type="error">{error}</Message>}
        {success && <Message $type="success">{success}</Message>}

        <Form onSubmit={handleSubmit}>
          {isAdmin ? (
            <>
              <InputGroup>
                <Label>Usuario o Código</Label>
                <InputWrapper>
                  <InputIcon>
                    <User />
                  </InputIcon>
                  <Input
                    type="text"
                    placeholder="Ingresa tu usuario o código"
                    value={codigoEstudiante}
                    onChange={(e) => setCodigoEstudiante(e.target.value)}
                    required
                    $hasIcon
                  />
                </InputWrapper>
              </InputGroup>

              <InputGroup>
                <Label>Contraseña</Label>
                <InputWrapper>
                  <InputIcon>
                    <Lock />
                  </InputIcon>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    $hasIcon
                    $hasToggle
                  />
                  <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </ToggleButton>
                </InputWrapper>
              </InputGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <SpinnerIcon size={20} />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </SubmitButton>
            </>
          ) : (
            <>
              {studentPhase === "code" && (
                <>
                  <InputGroup>
                    <Label>Código de Estudiante</Label>
                    <InputWrapper>
                      <InputIcon>
                        <User />
                      </InputIcon>
                      <Input
                        type="text"
                        placeholder="Ingresa tu código de estudiante"
                        value={codigoEstudiante}
                        onChange={(e) => setCodigoEstudiante(e.target.value)}
                        required
                        $hasIcon
                      />
                    </InputWrapper>
                  </InputGroup>

                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <SpinnerIcon size={20} />
                        Verificando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </SubmitButton>
                </>
              )}

              {studentPhase === "setup" && (
                <>
                  <InputGroup>
                    <Label>Nombre de Usuario</Label>
                    <InputWrapper>
                      <InputIcon>
                        <User />
                      </InputIcon>
                      <Input
                        type="text"
                        placeholder="Crea tu nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        $hasIcon
                      />
                    </InputWrapper>
                  </InputGroup>

                  <InputGroup>
                    <Label>Contraseña</Label>
                    <InputWrapper>
                      <InputIcon>
                        <Lock />
                      </InputIcon>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Crea tu contraseña (8-64 caracteres)"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        minLength={8}
                        maxLength={64}
                        pattern="[A-Za-z0-9]{8,64}"
                        required
                        $hasIcon
                        $hasToggle
                      />
                      <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </ToggleButton>
                    </InputWrapper>
                    <HintText>Solo letras (A–Z, a–z) y números (0–9)</HintText>
                  </InputGroup>

                  <InputGroup>
                    <Label>Confirmar Contraseña</Label>
                    <InputWrapper>
                      <InputIcon>
                        <Lock />
                      </InputIcon>
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirma tu contraseña"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        minLength={8}
                        maxLength={64}
                        pattern="[A-Za-z0-9]{8,64}"
                        required
                        $hasIcon
                        $hasToggle
                      />
                      <ToggleButton type="button" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff /> : <Eye />}
                      </ToggleButton>
                    </InputWrapper>
                  </InputGroup>

                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <SpinnerIcon size={20} />
                        Creando credenciales...
                      </>
                    ) : (
                      "Crear credenciales"
                    )}
                  </SubmitButton>
                </>
              )}

              {studentPhase === "password" && (
                <>
                  <InputGroup>
                    <Label>Contraseña</Label>
                    <InputWrapper>
                      <InputIcon>
                        <Lock />
                      </InputIcon>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu contraseña"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        $hasIcon
                        $hasToggle
                      />
                      <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </ToggleButton>
                    </InputWrapper>
                  </InputGroup>

                  <SubmitButton type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <SpinnerIcon size={20} />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </SubmitButton>
                </>
              )}
            </>
          )}
        </Form>

        <Footer>
          <ModeToggleButton
            type="button"
            onClick={() => {
              setIsAdmin(!isAdmin)
              setError("")
              setAdminPassword("")
              setStudentPhase('code')
              setStudentPassword('')
              setUsername('')
              setConfirm('')
            }}
          >
            {isAdmin ? "Acceso de Estudiante" : "Acceso de Admin"}
          </ModeToggleButton>
        </Footer>
      </Card>
    </Background>
  )
}
