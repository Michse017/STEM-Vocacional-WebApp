import React, { useState } from 'react';
import './admin.css';
// Views
import { VersionEditor } from './components/VersionEditor';
import { QuestionnairesGrid } from './components/QuestionnairesGrid';
import { QuestionnairePanel } from './components/QuestionnairePanel';
import { UsersPanel } from './components/UsersPanel';
import { UsersTable } from './components/UsersTable';
import { Segmented } from './components/ui/Segmented';

// QuestionnaireList moved to components/QuestionnaireList.jsx

// CreateQuestionnaire moved to components/CreateQuestionnaire.jsx

// VersionEditor / SectionBlock / QuestionBlock / OptionRow moved to components/*.jsx

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
    <div style={{ padding: '1.25rem', display: 'grid', gap: 24 }}>
      <div className="animate-fade-in" style={{ textAlign: 'center', position:'relative' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
          }}
        >
          Administrador – Cuestionarios Dinámicos
        </h1>
        <button onClick={logout} className='btn btn-secondary' style={{ position:'absolute', right:0, top:0 }}>Cerrar sesión</button>
        <p style={{ color: 'var(--text-muted)' }}>Crea, edita y publica cuestionarios. Administra usuarios por código.</p>
        {/* Top segmented navigation with animated indicator */}
        <div style={{ display:'grid', placeItems:'center', marginTop: 12 }}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'cuestionarios', label: 'Cuestionarios' },
              { value: 'usuarios', label: 'Control de usuarios' }
            ]}
          />
        </div>
      </div>
      {/* Main area */}
      <div style={{ display:'grid', gap: 16 }}>
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
          <div className='card'>
            <VersionEditor versionId={openVersion} onClose={()=>setMode('panel')} onRefreshList={()=>{ /* panel reloads on open */ }} />
          </div>
        )}

        {mode === 'usuarios' && (
          <div style={{ display:'grid', gap: 16 }}>
            <div className='card'>
              <UsersPanel />
            </div>
            <UsersModuleTable />
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Borrador: edita y publica. Las versiones publicadas son inmutables.</p>
    </div>
  );
}

// Inline helper to show UsersTable only when requested
function UsersModuleTable() {
  const [show, setShow] = useState(false);
  return (
    <div className='card'>
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
    </div>
  );
}
