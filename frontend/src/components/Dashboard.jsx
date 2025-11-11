import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getDynamicOverview } from "../api"
import styled from "styled-components"
import { BookOpen, CheckCircle2, List, LogOut, Award, TrendingUp } from "lucide-react"

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem 1rem;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 70% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`
 
const FloatingElement = styled.div`
  position: fixed;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 25px currentColor);
  
  &.atom {
    top: 10%;
    right: 10%;
    animation: float 6s ease-in-out infinite, pulse 3s ease-in-out infinite;
    color: #8B5CF6;
  }
  
  &.beaker {
    bottom: 20%;
    left: 5%;
    animation: float 8s ease-in-out infinite 1s, pulse 4s ease-in-out infinite 1s;
    color: #3B82F6;
  }
  
  &.gear {
    top: 60%;
    right: 15%;
    animation: rotate 20s linear infinite, pulse 5s ease-in-out infinite;
    color: #F59E0B;
  }

  &.dna {
    top: 30%;
    left: 8%;
    animation: float 10s ease-in-out infinite 2s, pulse 4s ease-in-out infinite;
    color: #10B981;
  }

  &.formula {
    bottom: 40%;
    right: 8%;
    animation: float 7s ease-in-out infinite 1.5s, pulse 3.5s ease-in-out infinite;
    color: #3B82F6;
  }

  &.microscope {
    top: 50%;
    left: 15%;
    animation: float 9s ease-in-out infinite 0.5s, pulse 4.5s ease-in-out infinite;
    color: #8B5CF6;
  }

  &.atom2 {
    bottom: 15%;
    right: 25%;
    animation: float 7s ease-in-out infinite 2.5s, pulse 3s ease-in-out infinite;
    color: #10B981;
  }

  &.calculator {
    top: 20%;
    left: 25%;
    animation: float 8s ease-in-out infinite 1.8s, pulse 4s ease-in-out infinite;
    color: #F59E0B;
  }

  &.molecule {
    bottom: 35%;
    left: 20%;
    animation: float 10s ease-in-out infinite 3s, pulse 5s ease-in-out infinite;
    color: #3B82F6;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-25px) scale(1.05); }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
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
  background: #ffffff;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.2);
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
  background: #ffffff;
  border: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
  animation: slideUp 0.6s ease-out, glow 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      #8B5CF6 0px,
      #8B5CF6 25%,
      #3B82F6 25%,
      #3B82F6 50%,
      #10B981 50%,
      #10B981 75%,
      #F59E0B 75%,
      #F59E0B 100%
    );
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(59, 130, 246, 0.05) 50%,
      transparent 70%
    );
    animation: shimmer 3s linear infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15); }
    50% { box-shadow: 0 4px 25px rgba(59, 130, 246, 0.25); }
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
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
  position: relative;
  z-index: 1;

  @keyframes badgePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6); }
  }
`

const QuestionnaireTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`

const QuestionnaireCode = styled.p`
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.75rem;
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const StatusBadge = styled.span`
  padding: 0.3rem 0.65rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  animation: fadeIn 0.5s ease-in;
  
  &.new {
    background: #fef3c7;
    color: #92400e;
    border: 2px solid #F59E0B;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
  }
  
  &.in_progress {
    background: #dbeafe;
    color: #1e40af;
    border: 2px solid #3B82F6;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    animation: fadeIn 0.5s ease-in, statusPulse 2s ease-in-out infinite;
  }
  
  &.finalized {
    background: #d1fae5;
    color: #065f46;
    border: 2px solid #10B981;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
  }

  @keyframes statusPulse {
    0%, 100% { box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.7); }
  }
`

const ProgressContainer = styled.div`
  flex: 1;
  min-width: 200px;
`

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  background: ${(props) => {
    const p = props.$progress || 0;
    if (p <= 25) return 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)';
    if (p <= 50) return 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 60%, #10B981 100%)';
    if (p <= 75) return 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 40%, #10B981 70%, #F59E0B 100%)';
    return 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 33%, #10B981 66%, #F59E0B 100%)';
  }};
  border-radius: 8px;
  transition: width 0.6s ease, background 0.6s ease;
  width: ${(props) => props.$progress || 0}%;
  box-shadow: 0 0 12px ${(props) => {
    const p = props.$progress || 0;
    if (p <= 25) return 'rgba(139, 92, 246, 0.6)';
    if (p <= 50) return 'rgba(59, 130, 246, 0.6)';
    if (p <= 75) return 'rgba(16, 185, 129, 0.6)';
    return 'rgba(245, 158, 11, 0.6)';
  }};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: progressShine 2s ease-in-out infinite;
  }

  @keyframes progressShine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
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
  position: relative;
  overflow: hidden;
  
  &.primary {
    background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.6);
      
      &::before {
        width: 300px;
        height: 300px;
      }
    }

    &:active {
      transform: translateY(-1px);
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
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid #10B981;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  text-align: center;
  animation: slideUp 0.6s ease-out, successGlow 2s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);

  @keyframes successGlow {
    0%, 100% { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); }
    50% { box-shadow: 0 4px 30px rgba(16, 185, 129, 0.6); }
  }
`

const CompletionIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  margin-bottom: 0.75rem;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
  animation: iconBounce 1s ease-in-out infinite;
  
  svg {
    color: white;
    width: 24px;
    height: 24px;
  }

  @keyframes iconBounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-5px) scale(1.05); }
  }
`

const CompletionText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #10B981;
  margin: 0;
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
    background: #dbeafe;
    color: #1e40af;
    border: 2px solid #3B82F6;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    
    &:hover {
      background: #bfdbfe;
      border-color: #2563eb;
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
      transform: translateY(-2px);
    }
  }
`

const LogoutButton = styled(Button)`
  &.danger {
    background: #fee2e2;
    color: #991b1b;
    border: 2px solid #ef4444;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    
    &:hover {
      background: #fecaca;
      border-color: #dc2626;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
      transform: translateY(-2px);
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
  animation: slideInLeft 0.6s ease-out;
  
  svg {
    color: #3B82F6;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
    animation: iconFloat 3s ease-in-out infinite;
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`

const HistorySectionTitle = styled(SectionTitle)`
  svg {
    color: #10B981;
    filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
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
  padding: 1rem 1.25rem;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  animation: fadeInUp 0.5s ease-out;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
    background: linear-gradient(180deg, #8B5CF6 0%, #3B82F6 33%, #10B981 66%, #F59E0B 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
  }

  &:hover {
    background: #f8fafc;
    border-color: #3B82F6;
    transform: translateX(8px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
    
    &::before {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
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
  animation: fadeIn 0.6s ease-in;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.4;
    color: #F59E0B;
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
    animation: emptyStateFloat 3s ease-in-out infinite;
  }
  
  p {
    font-size: 1rem;
  }

  @keyframes emptyStateFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
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
    border: 4px solid rgba(139, 92, 246, 0.2);
    border-top-color: #8B5CF6;
    border-right-color: #3B82F6;
    border-bottom-color: #10B981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
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
            fill="rgba(245, 158, 11, 0.7)"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <circle cx="50" cy="50" r="12" fill="white" stroke="#F59E0B" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <FloatingElement className="dna">
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
          <path
            d="M20 10 Q30 30 20 50 Q10 70 20 90 Q30 110 20 130"
            stroke="#10B981"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M60 10 Q50 30 60 50 Q70 70 60 90 Q50 110 60 130"
            stroke="#10B981"
            strokeWidth="3"
            fill="none"
          />
          <line x1="20" y1="20" x2="60" y2="20" stroke="#10B981" strokeWidth="2" opacity="0.8" />
          <line x1="25" y1="35" x2="55" y2="35" stroke="#10B981" strokeWidth="2" opacity="0.8" />
          <line x1="20" y1="50" x2="60" y2="50" stroke="#10B981" strokeWidth="2" opacity="0.8" />
          <line x1="25" y1="65" x2="55" y2="65" stroke="#10B981" strokeWidth="2" opacity="0.8" />
          <line x1="20" y1="80" x2="60" y2="80" stroke="#10B981" strokeWidth="2" opacity="0.8" />
        </svg>
      </FloatingElement>

      <FloatingElement className="formula">
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          <text x="10" y="35" fill="#3B82F6" fontSize="24" fontWeight="bold" fontFamily="serif">
            E=mc²
          </text>
          <circle cx="80" cy="20" r="8" fill="none" stroke="#3B82F6" strokeWidth="2" />
          <line x1="72" y1="20" x2="88" y2="20" stroke="#3B82F6" strokeWidth="2" />
          <line x1="80" y1="12" x2="80" y2="28" stroke="#3B82F6" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <FloatingElement className="microscope">
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <rect x="45" y="110" width="30" height="25" fill="#8B5CF6" opacity="0.5" />
          <circle cx="60" cy="95" r="12" stroke="#8B5CF6" strokeWidth="3" fill="rgba(139, 92, 246, 0.4)" />
          <rect x="55" y="60" width="10" height="35" fill="#8B5CF6" />
          <circle cx="60" cy="55" r="8" fill="#8B5CF6" />
          <path d="M60 55 L75 30 L80 35 L65 60 Z" fill="#8B5CF6" opacity="0.8" />
          <circle cx="80" cy="25" r="10" stroke="#8B5CF6" strokeWidth="2" fill="rgba(139, 92, 246, 0.5)" />
        </svg>
      </FloatingElement>

      <FloatingElement className="atom2">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="6" fill="#10B981" />
          <ellipse cx="50" cy="50" rx="40" ry="15" stroke="#10B981" strokeWidth="2.5" />
          <ellipse cx="50" cy="50" rx="15" ry="40" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="50" cy="20" r="4" fill="#10B981" />
          <circle cx="80" cy="50" r="4" fill="#10B981" />
          <circle cx="50" cy="80" r="4" fill="#10B981" />
        </svg>
      </FloatingElement>

      <FloatingElement className="calculator">
        <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
          <rect x="10" y="10" width="70" height="100" rx="8" fill="rgba(245, 158, 11, 0.4)" stroke="#F59E0B" strokeWidth="3" />
          <rect x="20" y="20" width="50" height="20" fill="#F59E0B" opacity="0.6" />
          <rect x="20" y="50" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="39" y="50" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="58" y="50" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="20" y="68" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="39" y="68" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="58" y="68" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="20" y="86" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="39" y="86" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
          <rect x="58" y="86" width="12" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
        </svg>
      </FloatingElement>

      <FloatingElement className="molecule">
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="30" cy="30" r="12" fill="#3B82F6" opacity="0.8" />
          <circle cx="80" cy="30" r="12" fill="#3B82F6" opacity="0.8" />
          <circle cx="55" cy="70" r="12" fill="#3B82F6" opacity="0.8" />
          <circle cx="30" cy="80" r="10" fill="#10B981" opacity="0.8" />
          <circle cx="80" cy="80" r="10" fill="#10B981" opacity="0.8" />
          <line x1="30" y1="30" x2="80" y2="30" stroke="#3B82F6" strokeWidth="3" />
          <line x1="30" y1="30" x2="55" y2="70" stroke="#3B82F6" strokeWidth="3" />
          <line x1="80" y1="30" x2="55" y2="70" stroke="#3B82F6" strokeWidth="3" />
          <line x1="55" y1="70" x2="30" y2="80" stroke="#10B981" strokeWidth="2" />
          <line x1="55" y1="70" x2="80" y2="80" stroke="#10B981" strokeWidth="2" />
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
