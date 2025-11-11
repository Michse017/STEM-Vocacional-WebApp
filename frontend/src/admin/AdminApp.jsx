import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { LogOut } from 'lucide-react';
import './admin.css';
// Views
import { VersionEditor } from './components/VersionEditor';
import { QuestionnairesGrid } from './components/QuestionnairesGrid';
import { QuestionnairePanel } from './components/QuestionnairePanel';
import { UsersPanel } from './components/UsersPanel';
import { UsersTable } from './components/UsersTable';
import { Segmented } from './components/ui/Segmented';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-25px) scale(1.05);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
`;

// Styled Components
const AdminContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 90% 70%, rgba(245, 158, 11, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
`;

const FloatingElement = styled.div`
  position: absolute;
  opacity: 0.4;
  animation: ${float} ${props => props.duration || '8s'} ease-in-out infinite,
             ${pulse} ${props => props.pulseDuration || '4s'} ease-in-out infinite;
  filter: drop-shadow(0 0 25px currentColor);
  z-index: 1;
  pointer-events: none;

  @media (max-width: 768px) {
    display: ${props => props.hideOnMobile ? 'none' : 'block'};
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #fee2e2;
  color: #991b1b;
  border: 2px solid #ef4444;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  @media (max-width: 768px) {
    position: static;
    margin: 1rem auto 0;
  }
`;

const SegmentedWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  animation: ${slideUp} 0.5s ease-out;
`;

const MainArea = styled.div`
  display: grid;
  gap: 1.5rem;
  animation: ${slideUp} 0.5s ease-out 0.1s backwards;
`;

const Card = styled.div`
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(2, 8, 20, 0.1);
`;

const Footer = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  margin-top: 2rem;
`;

export default function AdminApp() {
  // Navigation state
  // modes: 'cuestionarios' | 'usuarios' | 'panel' | 'version'
  const [mode, setMode] = useState('cuestionarios');
  const [selectedCode, setSelectedCode] = useState(null);
  const [openVersion, setOpenVersion] = useState(null);
  
  const logout = async () => {
    try { await fetch(`${(process.env.REACT_APP_ADMIN_API_BASE || 'http://localhost:5000/api')}/auth/admin/logout`, { method:'POST', credentials:'include' }); } catch (_) {}
    try { localStorage.removeItem('admin_token'); } catch (_) {}
    try { localStorage.removeItem('active_session'); } catch (_) {}
    window.location.href = '/login';
  };

  return (
    <AdminContainer>
      {/* Floating Scientific Elements */}
      <FloatingElement style={{ top: '10%', right: '10%', color: '#8B5CF6' }} duration="8s" pulseDuration="3s">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="8" fill="currentColor" />
          <ellipse cx="60" cy="60" rx="45" ry="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <ellipse cx="60" cy="60" rx="45" ry="15" stroke="currentColor" strokeWidth="3" fill="none" transform="rotate(60 60 60)" />
          <ellipse cx="60" cy="60" rx="45" ry="15" stroke="currentColor" strokeWidth="3" fill="none" transform="rotate(120 60 60)" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: '20%', left: '5%', color: '#3B82F6' }} duration="7s" pulseDuration="4s">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M50 10 L40 30 L50 30 L50 70 L60 70 L60 30 L70 30 Z" fill="currentColor" />
          <rect x="30" y="70" width="40" height="20" rx="2" fill="currentColor" />
          <path d="M45 40 Q50 50 55 40" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ top: '60%', right: '15%', color: '#F59E0B' }} duration="9s" pulseDuration="5s" hideOnMobile>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M50 15 L55 30 L70 30 L58 40 L63 55 L50 45 L37 55 L42 40 L30 30 L45 30 Z" fill="currentColor" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ top: '30%', left: '8%', color: '#10B981' }} duration="10s" pulseDuration="3.5s">
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
          <path d="M20 20 Q30 40 20 60 Q10 80 20 100" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M60 20 Q50 40 60 60 Q70 80 60 100" stroke="currentColor" strokeWidth="4" fill="none" />
          <line x1="25" y1="30" x2="55" y2="30" stroke="currentColor" strokeWidth="3" />
          <line x1="25" y1="50" x2="55" y2="50" stroke="currentColor" strokeWidth="3" />
          <line x1="25" y1="70" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
          <line x1="25" y1="90" x2="55" y2="90" stroke="currentColor" strokeWidth="3" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: '40%', right: '8%', color: '#3B82F6' }} duration="7.5s" pulseDuration="4.5s">
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          <text x="10" y="35" fontSize="32" fontWeight="bold" fill="currentColor" fontFamily="serif" fontStyle="italic">E=mc²</text>
          <circle cx="85" cy="20" r="6" fill="currentColor" />
          <circle cx="85" cy="20" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ top: '50%', left: '15%', color: '#8B5CF6' }} duration="8.5s" pulseDuration="4s" hideOnMobile>
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <rect x="40" y="20" width="40" height="60" rx="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="60" cy="100" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <rect x="30" y="110" width="60" height="8" rx="2" fill="currentColor" />
          <line x1="50" y1="80" x2="50" y2="100" stroke="currentColor" strokeWidth="3" />
          <line x1="70" y1="80" x2="70" y2="100" stroke="currentColor" strokeWidth="3" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: '15%', right: '25%', color: '#10B981' }} duration="9.5s" pulseDuration="3.5s" hideOnMobile>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="8" fill="currentColor" />
          <ellipse cx="50" cy="50" rx="35" ry="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <ellipse cx="50" cy="50" rx="10" ry="35" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ top: '20%', left: '25%', color: '#F59E0B' }} duration="7s" pulseDuration="5s" hideOnMobile>
        <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
          <rect x="10" y="20" width="70" height="90" rx="6" stroke="currentColor" strokeWidth="3" fill="none" />
          <line x1="25" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="2" />
          <line x1="25" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="25" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="2" />
          <rect x="25" y="75" width="15" height="15" rx="2" fill="currentColor" />
          <rect x="45" y="75" width="15" height="15" rx="2" fill="currentColor" />
          <rect x="25" y="92" width="15" height="15" rx="2" fill="currentColor" />
        </svg>
      </FloatingElement>

      <FloatingElement style={{ bottom: '35%', left: '20%', color: '#3B82F6' }} duration="8s" pulseDuration="4s" hideOnMobile>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="30" cy="40" r="12" fill="currentColor" />
          <circle cx="80" cy="40" r="12" fill="currentColor" />
          <circle cx="55" cy="70" r="12" fill="currentColor" />
          <circle cx="55" cy="30" r="12" fill="#10B981" />
          <line x1="30" y1="40" x2="55" y2="30" stroke="currentColor" strokeWidth="3" />
          <line x1="80" y1="40" x2="55" y2="30" stroke="currentColor" strokeWidth="3" />
          <line x1="30" y1="40" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
          <line x1="80" y1="40" x2="55" y2="70" stroke="currentColor" strokeWidth="3" />
        </svg>
      </FloatingElement>

      <Content>
        <Header>
          <Title>Administrador – Cuestionarios Dinámicos</Title>
          <Subtitle>Crea, edita y publica cuestionarios. Administra usuarios por código.</Subtitle>
          <LogoutButton onClick={logout}>
            <LogOut size={20} />
            Cerrar sesión
          </LogoutButton>
        </Header>

        <SegmentedWrapper>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'cuestionarios', label: 'Cuestionarios' },
              { value: 'usuarios', label: 'Control de usuarios' }
            ]}
          />
        </SegmentedWrapper>

        <MainArea>
          {mode === 'cuestionarios' && (
            <QuestionnairesGrid onOpenPanel={(code)=>{ setSelectedCode(code); setMode('panel'); }} />
          )}

          {mode === 'panel' && selectedCode && (
            <QuestionnairePanel
              code={selectedCode}
              onBack={()=>setMode('cuestionarios')}
              onOpenVersion={(id)=>{ setOpenVersion(id); setMode('version'); }}
            />
          )}

          {mode === 'version' && openVersion && (
            <Card>
              <VersionEditor versionId={openVersion} onClose={()=>setMode('panel')} onRefreshList={()=>{ /* panel reloads on open */ }} />
            </Card>
          )}

          {mode === 'usuarios' && (
            <>
              <Card>
                <UsersPanel />
              </Card>
              <UsersModuleTable />
            </>
          )}
        </MainArea>

        <Footer>Borrador: edita y publica. Las versiones publicadas son inmutables.</Footer>
      </Content>
    </AdminContainer>
  );
}

// Inline helper to show UsersTable only when requested
function UsersModuleTable() {
  const [show, setShow] = useState(false);
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 className='admin-h2'>Usuarios registrados</h2>
        <button className='btn btn-secondary btn-sm' onClick={()=>setShow(s=>!s)}>
          {show ? 'Ocultar tabla' : 'Ver tabla'}
        </button>
      </div>
      {show && (
        <div style={{ marginTop: 8 }}>
          <UsersTable />
        </div>
      )}
    </Card>
  );
}
