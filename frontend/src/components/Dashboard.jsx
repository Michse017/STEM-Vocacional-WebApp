import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getDynamicOverview } from "../api"
import styled from "styled-components"
import { BookOpen, CheckCircle2, List, LogOut, Award, TrendingUp } from "lucide-react"

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%);
  padding: 2rem 1rem;
  position: relative;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const FloatingElement = styled.div`
  position: fixed;
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
  
  &.atom {
    top: 10%;
    right: 10%;
    animation: float 6s ease-in-out infinite;
  }
  
  &.beaker {
    bottom: 20%;
    left: 5%;
    animation: float 8s ease-in-out infinite 1s;
  }
  
  &.gear {
    top: 60%;
    right: 15%;
    animation: rotate 20s linear infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeIn 0.6s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`

const Card = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  animation: slideUp 0.6s ease-out;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`

const PrimaryCard = styled(Card)`
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%);
  }
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
`

const QuestionnaireTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
`

const QuestionnaireCode = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const StatusBadge = styled.span`
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  
  &.new {
    background: rgba(245, 158, 11, 0.15);
    color: #F59E0B;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  &.in_progress {
    background: rgba(59, 130, 246, 0.15);
    color: #3B82F6;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  
  &.finalized {
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
`

const ProgressContainer = styled.div`
  flex: 1;
  min-width: 200px;
`

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(226, 232, 240, 0.5);
  border-radius: 10px;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6 0%, #3B82F6 50%, #10B981 100%);
  border-radius: 10px;
  transition: width 0.6s ease;
  width: ${(props) => props.$progress || 0}%;
`

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
    }
  }
  
  &.secondary {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
    
    &:hover {
      background: rgba(59, 130, 246, 0.2);
    }
  }
  
  &.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.2);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`

const CompletionCard = styled(Card)`
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 2px solid rgba(16, 185, 129, 0.3);
  margin-bottom: 2rem;
  text-align: center;
`

const CompletionIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  margin-bottom: 1rem;
  
  svg {
    color: white;
    width: 32px;
    height: 32px;
  }
`

const CompletionText = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: #10B981;
`

const ActionButtonsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const ListButton = styled(Button)`
  &.secondary {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    color: #3B82F6;
    border: 1px solid rgba(59, 130, 246, 0.2);
    
    &:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
      border-color: rgba(59, 130, 246, 0.3);
    }
  }
`

const LogoutButton = styled(Button)`
  &.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    
    &:hover {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
      border-color: rgba(239, 68, 68, 0.3);
    }
  }
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #3B82F6;
  }
`

const HistorySectionTitle = styled(SectionTitle)`
  svg {
    color: #10B981;
  }
`

const QuestionnaireList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const QuestionnaireItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
    background: linear-gradient(180deg, #3B82F6 0%, #10B981 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateX(4px);
    
    &::before {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`

const QuestionnaireInfo = styled.div`
  flex: 1;
`

const QuestionnaireItemTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`

const QuestionnaireItemCode = styled.p`
  font-size: 0.875rem;
  color: #64748b;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.3;
    color: #F59E0B;
  }
  
  p {
    font-size: 1rem;
  }
`

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  
  &::after {
    content: '';
    width: 48px;
    height: 48px;
    border: 4px solid rgba(139, 92, 246, 0.1);
    border-top-color: #8B5CF6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const ErrorMessage = styled.div`
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  margin-bottom: 1rem;
`

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

  const getStatusLabel = (status) => {
    if (status === "finalized") return "Finalizado"
    if (status === "in_progress") return "En progreso"
    return "Pendiente"
  }

  const getButtonText = (status, answeredCount) => {
    if (status === "finalized") return "Revisar"
    if (status === "in_progress" || answeredCount > 0) return "Continuar"
    return "Responder"
  }

  if (!usuario) {
    return (
      <DashboardContainer>
        <ContentWrapper>
          <Card style={{ textAlign: "center", marginTop: "3rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>No se han cargado datos</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Por favor, inicia sesión para continuar.
            </p>
            <Button className="primary" onClick={() => navigate("/login")}>
              Ir a Login
            </Button>
          </Card>
        </ContentWrapper>
      </DashboardContainer>
    )
  }

  // If primary dynamic questionnaire exists, prefer dynamic-first UI and hide legacy progress blocks
  const hasPrimary = Boolean(primary.data)
  const primaryTotal = hasPrimary ? (primary.data.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0) : 0
  const primaryAnswered = hasPrimary ? (primary.user?.answers ? Object.keys(primary.user.answers).length : 0) : 0
  const primaryStatus = primary.user?.status
  const primaryProgressCalc = hasPrimary && primaryTotal > 0 ? Math.min(100, Math.round((primaryAnswered / primaryTotal) * 100)) : 0
  const primaryProgress = primaryStatus === 'finalized' ? 100 : primaryProgressCalc

  // Separate finalized and available questionnaires
  const finalizedQuestionnaires = dynWithUser.items.filter(i => i.status === 'finalized') || []
  const availableQuestionnaires = dynWithUser.items.filter(i => i.status !== 'finalized') || []

  return (
    <DashboardContainer>
      <FloatingElement className="atom">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="8" fill="#8B5CF6" />
          <ellipse cx="60" cy="60" rx="50" ry="20" stroke="#8B5CF6" strokeWidth="2" />
          <ellipse cx="60" cy="60" rx="20" ry="50" stroke="#3B82F6" strokeWidth="2" />
          <ellipse cx="60" cy="60" rx="40" ry="35" stroke="#10B981" strokeWidth="2" transform="rotate(45 60 60)" />
        </svg>
      </FloatingElement>

      <FloatingElement className="beaker">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path
            d="M35 10 L35 40 L20 70 C15 80 20 90 30 90 L70 90 C80 90 85 80 80 70 L65 40 L65 10 Z"
            stroke="#3B82F6"
            strokeWidth="2"
            fill="rgba(59, 130, 246, 0.1)"
          />
          <line x1="30" y1="10" x2="70" y2="10" stroke="#3B82F6" strokeWidth="3" />
        </svg>
      </FloatingElement>

      <FloatingElement className="gear">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z"
            fill="rgba(245, 158, 11, 0.5)"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <circle cx="50" cy="50" r="12" fill="white" stroke="#F59E0B" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <ContentWrapper>
        <Header>
          <Title>Mi Panel de Control</Title>
          <Subtitle>Bienvenido, {usuario.username || usuario.codigo_estudiante}</Subtitle>
        </Header>

        {primary.loading ? (
          <LoadingSpinner />
        ) : primary.error ? (
          <ErrorMessage>{primary.error}</ErrorMessage>
        ) : primary.data ? (
          <>
            <PrimaryCard>
              <Badge>
                <Award size={16} />
                Principal
              </Badge>
              <QuestionnaireTitle>{primary.data.title || primary.data.code}</QuestionnaireTitle>
              <QuestionnaireCode>Código: {primary.data.code}</QuestionnaireCode>

              <StatusRow>
                <StatusBadge className={primaryStatus || "new"}>
                  {getStatusLabel(primaryStatus)}
                </StatusBadge>

                <ProgressContainer>
                  <ProgressLabel>
                    <span>Progreso</span>
                    <span>{primaryProgress}%</span>
                  </ProgressLabel>
                  <ProgressBar>
                    <ProgressFill $progress={primaryProgress} />
                  </ProgressBar>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {primaryAnswered} de {primaryTotal} preguntas
                  </div>
                </ProgressContainer>
              </StatusRow>

              <Button 
                className="primary" 
                onClick={() => navigate(`/dynamic/${encodeURIComponent(primary.data.code)}`, { state: { usuario }, replace: false })}
              >
                <BookOpen size={20} />
                {getButtonText(primaryStatus, primaryAnswered)}
              </Button>
            </PrimaryCard>

            {primaryStatus === 'finalized' && (
              <CompletionCard>
                <CompletionIcon>
                  <CheckCircle2 />
                </CompletionIcon>
                <CompletionText>Has completado el cuestionario principal. ¡Excelente trabajo!</CompletionText>
              </CompletionCard>
            )}
          </>
        ) : null}

        <ActionButtonsRow>
          <ListButton 
            className="secondary" 
            onClick={() => navigate('/dynamic', { state: { usuario } })}
          >
            <List size={20} />
            Cuestionarios Disponibles
          </ListButton>
          <LogoutButton className="danger" onClick={handleLogout}>
            <LogOut size={20} />
            Cerrar Sesión
          </LogoutButton>
        </ActionButtonsRow>

        <Card style={{ marginBottom: "2rem" }}>
          <SectionTitle>
            <TrendingUp size={24} />
            Cuestionarios Disponibles
          </SectionTitle>

          {dynWithUser.loading ? (
            <LoadingSpinner />
          ) : dynWithUser.error ? (
            <ErrorMessage>{dynWithUser.error}</ErrorMessage>
          ) : availableQuestionnaires.length === 0 ? (
            <EmptyState>
              <BookOpen />
              <p>No hay cuestionarios disponibles en este momento</p>
            </EmptyState>
          ) : (
            <QuestionnaireList>
              {availableQuestionnaires.map((item) => {
                const itemStatus = item?.status || 'new'
                const itemProgress = item?.progress_percent ?? 0
                return (
                  <QuestionnaireItem key={item.code}>
                    <QuestionnaireInfo>
                      <QuestionnaireItemTitle>{item.title || item.code}</QuestionnaireItemTitle>
                      <QuestionnaireItemCode>Código: {item.code}</QuestionnaireItemCode>
                      <StatusRow style={{ marginBottom: 0, marginTop: "0.5rem" }}>
                        <StatusBadge className={itemStatus}>{getStatusLabel(itemStatus)}</StatusBadge>
                        <ProgressContainer>
                          <ProgressBar>
                            <ProgressFill $progress={itemProgress} />
                          </ProgressBar>
                        </ProgressContainer>
                      </StatusRow>
                    </QuestionnaireInfo>
                    <Button
                      className="primary"
                      onClick={() => navigate(`/dynamic/${encodeURIComponent(item.code)}`, { state: { usuario } })}
                    >
                      {getButtonText(itemStatus, itemProgress)}
                    </Button>
                  </QuestionnaireItem>
                )
              })}
            </QuestionnaireList>
          )}
        </Card>

        {finalizedQuestionnaires.length > 0 && (
          <Card>
            <HistorySectionTitle>
              <CheckCircle2 size={24} />
              Cuestionarios Finalizados
            </HistorySectionTitle>
            <QuestionnaireList>
              {finalizedQuestionnaires
                .sort((a, b) => {
                  const da = a.finalized_at ? new Date(a.finalized_at).getTime() : 0
                  const db = b.finalized_at ? new Date(b.finalized_at).getTime() : 0
                  return db - da
                })
                .map((item) => (
                  <QuestionnaireItem key={item.code}>
                    <QuestionnaireInfo>
                      <QuestionnaireItemTitle>{item.title || item.code}</QuestionnaireItemTitle>
                      <QuestionnaireItemCode>Código: {item.code}</QuestionnaireItemCode>
                      <StatusBadge className="finalized" style={{ marginTop: "0.5rem" }}>
                        Completado
                      </StatusBadge>
                      {item.finalized_at && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Finalizado: {new Date(item.finalized_at).toLocaleString()}
                        </div>
                      )}
                    </QuestionnaireInfo>
                    <Button
                      className="secondary"
                      onClick={() => navigate(`/dynamic/${encodeURIComponent(item.code)}`, { state: { usuario } })}
                    >
                      Revisar
                    </Button>
                  </QuestionnaireItem>
                ))}
            </QuestionnaireList>
          </Card>
        )}
      </ContentWrapper>
    </DashboardContainer>
  )
}
