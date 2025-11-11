import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDynamicOverview } from "../api";
import styled, { keyframes } from "styled-components";
import { ArrowLeft, TrendingUp, CheckCircle2, Calendar, Clock, FileText, BookOpen } from "lucide-react";

// Keyframe Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-25px) scale(1.05); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const badgePulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(139, 92, 246, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(139, 92, 246, 0.7); }
`;

const statusPulse = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.7); }
`;

const progressShine = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const emptyStateFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const iconFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const DynamicListContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #e9d5ff 0%, #dbeafe 30%, #a7f3d0 60%, #fef3c7 100%);
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
      radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 70% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FloatingElement = styled.div`
  position: fixed;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 25px currentColor);
  animation: ${float} ${props => props.$duration || '6s'} ease-in-out infinite, 
             ${pulse} ${props => props.$pulseDuration || '4s'} ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  
  &.atom { color: #8B5CF6; }
  &.beaker { color: #3B82F6; }
  &.gear { color: #F59E0B; }
  &.dna { color: #10B981; }
  &.formula { color: #3B82F6; }
  &.microscope { color: #8B5CF6; }
  &.atom2 { color: #10B981; }
  &.calculator { color: #F59E0B; }
  &.molecule { color: #3B82F6; }

  @media (max-width: 768px) {
    display: ${props => props.$hideOnMobile ? 'none' : 'block'};
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2.5rem;
  animation: ${fadeIn} 0.6s ease-in;
`;

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
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  border: 2px solid #ef4444;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);

  &:hover {
    background: #fecaca;
    border-color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  animation: ${slideInLeft} 0.6s ease-out;

  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color || '#3B82F6'};
    filter: drop-shadow(0 0 8px ${props => props.$color || '#3B82F6'}80);
    animation: ${iconFloat} 3s ease-in-out infinite;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const QuestionnaireList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

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
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => props.$index * 0.1}s;
  animation-fill-mode: backwards;

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
`;

const QuestionnaireInfo = styled.div`
  flex: 1;
`;

const QuestionnaireItemTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const QuestionnaireItemCode = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.3rem 0.65rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  animation: ${fadeIn} 0.5s ease-in;
  white-space: nowrap;
  
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
    animation: ${fadeIn} 0.5s ease-in, ${statusPulse} 2s ease-in-out infinite;
  }
  
  &.finalized {
    background: #d1fae5;
    color: #065f46;
    border: 2px solid #10B981;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ProgressContainer = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

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
    animation: ${progressShine} 2s ease-in-out infinite;
  }
`;

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
  white-space: nowrap;
  
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

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.6s ease-in;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.4;
    color: #F59E0B;
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
    animation: ${emptyStateFloat} 3s ease-in-out infinite;
  }
  
  h3 {
    font-size: 1.3rem;
    color: #475569;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0;
  }
`;

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
    animation: ${spin} 1s linear infinite;
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
`;

const ErrorMessage = styled.div`
  padding: 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 12px;
  border: 2px solid #fecaca;
  margin-bottom: 1rem;
  text-align: center;
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    color: #dc2626;
  }
`;

const DateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }
`;

export default function DynamicList() {
  const location = useLocation();
  const navigate = useNavigate();
  let { usuario } = location.state || {};
  
  if (!usuario) {
    try { 
      const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); 
      if (u && u.id_usuario) usuario = u; 
    } catch (_) {}
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
    }
  }, [usuario, navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ov = await getDynamicOverview(usuario?.codigo_estudiante || '');
        if (!mounted) return;
        const arr = [];
        if (ov?.primary?.questionnaire) {
          const q = ov.primary.questionnaire;
          arr.push({
            code: q.code,
            title: q.title,
            status: ov.primary.user?.status || 'new',
            progress_percent: (() => {
              const total = (q.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0);
              const answered = ov.primary.user?.answers ? Object.keys(ov.primary.user.answers).length : 0;
              const p = total > 0 ? Math.round((answered / total) * 100) : 0;
              return (ov.primary.user?.status === 'finalized') ? 100 : p;
            })(),
            finalized_at: ov.primary.user?.finalized_at || null,
            total_questions: (q.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0),
            answered_questions: ov.primary.user?.answers ? Object.keys(ov.primary.user.answers).length : 0,
          });
        }
        for (const i of (ov?.items || [])) arr.push(i);
        setItems(arr);
      } catch (e) {
        if (mounted) setError(e.message || "No se pudo cargar la lista.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [usuario?.codigo_estudiante]);

  const handleBack = () => {
    navigate("/dashboard", { state: { usuario } });
  };

  const getStatusLabel = (status) => {
    if (status === "finalized") return "Finalizado";
    if (status === "in_progress") return "En progreso";
    return "Nuevo";
  };

  const getButtonText = (status, progress) => {
    if (status === "finalized") return "Revisar";
    if (status === "in_progress" || progress > 0) return "Continuar";
    return "Responder";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Separate finalized and available questionnaires
  const finalizedQuestionnaires = items.filter(i => i.status === 'finalized').sort((a, b) => {
    const da = a.finalized_at ? new Date(a.finalized_at).getTime() : 0;
    const db = b.finalized_at ? new Date(b.finalized_at).getTime() : 0;
    return db - da;
  });
  
  const availableQuestionnaires = items.filter(i => i.status !== 'finalized');

  if (loading) {
    return (
      <DynamicListContainer>
        {/* 9 Floating Elements */}
        <FloatingElement className="atom" style={{ top: '10%', right: '10%' }} $duration="6s" $pulseDuration="3s">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="8" fill="currentColor" />
            <ellipse cx="60" cy="60" rx="50" ry="20" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="60" cy="60" rx="20" ry="50" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="60" cy="60" rx="40" ry="35" stroke="currentColor" strokeWidth="2" transform="rotate(45 60 60)" />
          </svg>
        </FloatingElement>

        <FloatingElement className="beaker" style={{ bottom: '20%', left: '5%' }} $duration="8s" $pulseDuration="4s" $delay="1s">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <path d="M35 10 L35 40 L20 70 C15 80 20 90 30 90 L70 90 C80 90 85 80 80 70 L65 40 L65 10 Z" stroke="currentColor" strokeWidth="2" fill="rgba(59, 130, 246, 0.3)" />
            <line x1="30" y1="10" x2="70" y2="10" stroke="currentColor" strokeWidth="3" />
          </svg>
        </FloatingElement>

        <FloatingElement className="gear" style={{ top: '60%', right: '15%' }} $duration="20s" $pulseDuration="5s">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <path d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z" fill="rgba(245, 158, 11, 0.7)" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="2" />
          </svg>
        </FloatingElement>

        <FloatingElement className="dna" style={{ top: '30%', left: '8%' }} $duration="10s" $pulseDuration="4s" $delay="2s" $hideOnMobile>
          <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
            <path d="M20 10 Q30 30 20 50 Q10 70 20 90 Q30 110 20 130" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M60 10 Q50 30 60 50 Q70 70 60 90 Q50 110 60 130" stroke="currentColor" strokeWidth="3" fill="none" />
            <line x1="20" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.8" />
            <line x1="25" y1="35" x2="55" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.8" />
            <line x1="20" y1="50" x2="60" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.8" />
            <line x1="25" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="2" opacity="0.8" />
            <line x1="20" y1="80" x2="60" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          </svg>
        </FloatingElement>

        <FloatingElement className="formula" style={{ bottom: '40%', right: '8%' }} $duration="7s" $pulseDuration="3.5s" $delay="1.5s" $hideOnMobile>
          <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
            <text x="10" y="35" fill="currentColor" fontSize="24" fontWeight="bold" fontFamily="serif">E=mc²</text>
            <circle cx="80" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="72" y1="20" x2="88" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="80" y1="12" x2="80" y2="28" stroke="currentColor" strokeWidth="2" />
          </svg>
        </FloatingElement>

        <FloatingElement className="microscope" style={{ top: '50%', left: '15%' }} $duration="9s" $pulseDuration="4.5s" $delay="0.5s" $hideOnMobile>
          <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
            <rect x="45" y="110" width="30" height="25" fill="currentColor" opacity="0.5" />
            <circle cx="60" cy="95" r="12" stroke="currentColor" strokeWidth="3" fill="rgba(139, 92, 246, 0.4)" />
            <rect x="55" y="60" width="10" height="35" fill="currentColor" />
            <circle cx="60" cy="55" r="8" fill="currentColor" />
            <path d="M60 55 L75 30 L80 35 L65 60 Z" fill="currentColor" opacity="0.8" />
            <circle cx="80" cy="25" r="10" stroke="currentColor" strokeWidth="2" fill="rgba(139, 92, 246, 0.5)" />
          </svg>
        </FloatingElement>

        <FloatingElement className="atom2" style={{ bottom: '15%', right: '25%' }} $duration="7s" $pulseDuration="3s" $delay="2.5s">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="6" fill="currentColor" />
            <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth="2.5" />
            <ellipse cx="50" cy="50" rx="15" ry="40" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="50" cy="20" r="4" fill="currentColor" />
            <circle cx="80" cy="50" r="4" fill="currentColor" />
            <circle cx="50" cy="80" r="4" fill="currentColor" />
          </svg>
        </FloatingElement>

        <FloatingElement className="calculator" style={{ top: '20%', left: '25%' }} $duration="8s" $pulseDuration="4s" $delay="1.8s" $hideOnMobile>
          <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
            <rect x="10" y="10" width="70" height="100" rx="8" fill="rgba(245, 158, 11, 0.4)" stroke="currentColor" strokeWidth="3" />
            <rect x="20" y="20" width="50" height="20" fill="currentColor" opacity="0.6" />
            <rect x="20" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="39" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="58" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="20" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="39" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="58" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="20" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="39" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="58" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          </svg>
        </FloatingElement>

        <FloatingElement className="molecule" style={{ bottom: '35%', left: '20%' }} $duration="10s" $pulseDuration="5s" $delay="3s" $hideOnMobile>
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
            <circle cx="30" cy="30" r="12" fill="currentColor" opacity="0.8" />
            <circle cx="80" cy="30" r="12" fill="currentColor" opacity="0.8" />
            <circle cx="55" cy="70" r="12" fill="currentColor" opacity="0.8" />
            <circle cx="30" cy="80" r="10" fill="#10B981" opacity="0.8" />
            <circle cx="80" cy="80" r="10" fill="#10B981" opacity="0.8" />
            <line x1="30" y1="30" x2="80" y2="30" stroke="currentColor" strokeWidth="3" />
            <line x1="30" y1="30" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
            <line x1="80" y1="30" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
            <line x1="55" y1="70" x2="30" y2="80" stroke="#10B981" strokeWidth="2" />
            <line x1="55" y1="70" x2="80" y2="80" stroke="#10B981" strokeWidth="2" />
          </svg>
        </FloatingElement>

        <ContentWrapper>
          <LoadingSpinner />
        </ContentWrapper>
      </DynamicListContainer>
    );
  }

  if (error) {
    return (
      <DynamicListContainer>
        <ContentWrapper>
          <BackButton onClick={handleBack}>
            <ArrowLeft />
            Volver al Dashboard
          </BackButton>
          <ErrorMessage>
            <h3>Error al cargar</h3>
            <p>{error}</p>
          </ErrorMessage>
        </ContentWrapper>
      </DynamicListContainer>
    );
  }

  return (
    <DynamicListContainer>
      {/* 9 Floating Elements - Same as loading state */}
      <FloatingElement className="atom" style={{ top: '10%', right: '10%' }} $duration="6s" $pulseDuration="3s">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="8" fill="currentColor" />
          <ellipse cx="60" cy="60" rx="50" ry="20" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="60" cy="60" rx="20" ry="50" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="60" cy="60" rx="40" ry="35" stroke="currentColor" strokeWidth="2" transform="rotate(45 60 60)" />
        </svg>
      </FloatingElement>

      <FloatingElement className="beaker" style={{ bottom: '20%', left: '5%' }} $duration="8s" $pulseDuration="4s" $delay="1s">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M35 10 L35 40 L20 70 C15 80 20 90 30 90 L70 90 C80 90 85 80 80 70 L65 40 L65 10 Z" stroke="currentColor" strokeWidth="2" fill="rgba(59, 130, 246, 0.3)" />
          <line x1="30" y1="10" x2="70" y2="10" stroke="currentColor" strokeWidth="3" />
        </svg>
      </FloatingElement>

      <FloatingElement className="gear" style={{ top: '60%', right: '15%' }} $duration="20s" $pulseDuration="5s">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z" fill="rgba(245, 158, 11, 0.7)" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <FloatingElement className="dna" style={{ top: '30%', left: '8%' }} $duration="10s" $pulseDuration="4s" $delay="2s" $hideOnMobile>
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
          <path d="M20 10 Q30 30 20 50 Q10 70 20 90 Q30 110 20 130" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M60 10 Q50 30 60 50 Q70 70 60 90 Q50 110 60 130" stroke="currentColor" strokeWidth="3" fill="none" />
          <line x1="20" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <line x1="25" y1="35" x2="55" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <line x1="20" y1="50" x2="60" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <line x1="25" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <line x1="20" y1="80" x2="60" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.8" />
        </svg>
      </FloatingElement>

      <FloatingElement className="formula" style={{ bottom: '40%', right: '8%' }} $duration="7s" $pulseDuration="3.5s" $delay="1.5s" $hideOnMobile>
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          <text x="10" y="35" fill="currentColor" fontSize="24" fontWeight="bold" fontFamily="serif">E=mc²</text>
          <circle cx="80" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="72" y1="20" x2="88" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="80" y1="12" x2="80" y2="28" stroke="currentColor" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <FloatingElement className="microscope" style={{ top: '50%', left: '15%' }} $duration="9s" $pulseDuration="4.5s" $delay="0.5s" $hideOnMobile>
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <rect x="45" y="110" width="30" height="25" fill="currentColor" opacity="0.5" />
          <circle cx="60" cy="95" r="12" stroke="currentColor" strokeWidth="3" fill="rgba(139, 92, 246, 0.4)" />
          <rect x="55" y="60" width="10" height="35" fill="currentColor" />
          <circle cx="60" cy="55" r="8" fill="currentColor" />
          <path d="M60 55 L75 30 L80 35 L65 60 Z" fill="currentColor" opacity="0.8" />
          <circle cx="80" cy="25" r="10" stroke="currentColor" strokeWidth="2" fill="rgba(139, 92, 246, 0.5)" />
        </svg>
      </FloatingElement>

      <FloatingElement className="atom2" style={{ bottom: '15%', right: '25%' }} $duration="7s" $pulseDuration="3s" $delay="2.5s">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="6" fill="currentColor" />
          <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="50" cy="50" rx="15" ry="40" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="50" cy="20" r="4" fill="currentColor" />
          <circle cx="80" cy="50" r="4" fill="currentColor" />
          <circle cx="50" cy="80" r="4" fill="currentColor" />
        </svg>
      </FloatingElement>

      <FloatingElement className="calculator" style={{ top: '20%', left: '25%' }} $duration="8s" $pulseDuration="4s" $delay="1.8s" $hideOnMobile>
        <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
          <rect x="10" y="10" width="70" height="100" rx="8" fill="rgba(245, 158, 11, 0.4)" stroke="currentColor" strokeWidth="3" />
          <rect x="20" y="20" width="50" height="20" fill="currentColor" opacity="0.6" />
          <rect x="20" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="39" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="58" y="50" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="20" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="39" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="58" y="68" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="20" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="39" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="58" y="86" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
        </svg>
      </FloatingElement>

      <FloatingElement className="molecule" style={{ bottom: '35%', left: '20%' }} $duration="10s" $pulseDuration="5s" $delay="3s" $hideOnMobile>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="30" cy="30" r="12" fill="currentColor" opacity="0.8" />
          <circle cx="80" cy="30" r="12" fill="currentColor" opacity="0.8" />
          <circle cx="55" cy="70" r="12" fill="currentColor" opacity="0.8" />
          <circle cx="30" cy="80" r="10" fill="#10B981" opacity="0.8" />
          <circle cx="80" cy="80" r="10" fill="#10B981" opacity="0.8" />
          <line x1="30" y1="30" x2="80" y2="30" stroke="currentColor" strokeWidth="3" />
          <line x1="30" y1="30" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
          <line x1="80" y1="30" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
          <line x1="55" y1="70" x2="30" y2="80" stroke="#10B981" strokeWidth="2" />
          <line x1="55" y1="70" x2="80" y2="80" stroke="#10B981" strokeWidth="2" />
        </svg>
      </FloatingElement>

      <ContentWrapper>
        <Header>
          <Title>Cuestionarios Disponibles</Title>
          <Subtitle>Explora y completa los cuestionarios adicionales</Subtitle>
        </Header>

        <BackButton onClick={handleBack}>
          <ArrowLeft />
          Volver al Dashboard
        </BackButton>

        {/* Available Questionnaires Section */}
        {availableQuestionnaires.length > 0 && (
          <Section>
            <SectionHeader $color="#3B82F6">
              <TrendingUp />
              <SectionTitle>Cuestionarios Disponibles</SectionTitle>
            </SectionHeader>
            <QuestionnaireList>
              {availableQuestionnaires.map((q, index) => {
                const itemStatus = q?.status || 'new';
                const itemProgress = q?.progress_percent ?? 0;
                return (
                  <QuestionnaireItem key={q.code} $index={index}>
                    <QuestionnaireInfo>
                      <QuestionnaireItemTitle>{q.title || q.code}</QuestionnaireItemTitle>
                      <QuestionnaireItemCode>Código: {q.code}</QuestionnaireItemCode>
                      <StatusRow>
                        <StatusBadge className={itemStatus}>
                          {itemStatus === 'new' && <FileText />}
                          {itemStatus === 'in_progress' && <Clock />}
                          {getStatusLabel(itemStatus)}
                        </StatusBadge>
                        <ProgressContainer>
                          <ProgressBar>
                            <ProgressFill $progress={itemProgress} />
                          </ProgressBar>
                        </ProgressContainer>
                      </StatusRow>
                    </QuestionnaireInfo>
                    <Button
                      className="primary"
                      onClick={() => navigate(`/dynamic/${encodeURIComponent(q.code)}`, { state: { usuario } })}
                    >
                      <BookOpen size={20} />
                      {getButtonText(itemStatus, itemProgress)}
                    </Button>
                  </QuestionnaireItem>
                );
              })}
            </QuestionnaireList>
          </Section>
        )}

        {/* Finalized Questionnaires Section */}
        {finalizedQuestionnaires.length > 0 && (
          <Section>
            <SectionHeader $color="#10B981">
              <CheckCircle2 />
              <SectionTitle>Cuestionarios Finalizados</SectionTitle>
            </SectionHeader>
            <QuestionnaireList>
              {finalizedQuestionnaires.map((q, index) => (
                <QuestionnaireItem key={q.code} $index={index}>
                  <QuestionnaireInfo>
                    <QuestionnaireItemTitle>{q.title || q.code}</QuestionnaireItemTitle>
                    <QuestionnaireItemCode>Código: {q.code}</QuestionnaireItemCode>
                    <StatusRow>
                      <StatusBadge className="finalized">
                        <CheckCircle2 />
                        Completado
                      </StatusBadge>
                      {q.finalized_at && (
                        <DateInfo>
                          <Calendar />
                          {formatDate(q.finalized_at)}
                        </DateInfo>
                      )}
                    </StatusRow>
                  </QuestionnaireInfo>
                  <Button
                    className="secondary"
                    onClick={() => navigate(`/dynamic/${encodeURIComponent(q.code)}`, { state: { usuario } })}
                  >
                    Revisar
                  </Button>
                </QuestionnaireItem>
              ))}
            </QuestionnaireList>
          </Section>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <EmptyState>
            <BookOpen />
            <h3>No hay cuestionarios disponibles</h3>
            <p>Vuelve más tarde para ver nuevas evaluaciones</p>
          </EmptyState>
        )}
      </ContentWrapper>
    </DynamicListContainer>
  );
}
