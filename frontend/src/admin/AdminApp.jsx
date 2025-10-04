import React, { useState } from 'react';
import './admin.css';
//
import { VersionEditor } from './components/VersionEditor';
import { CreateQuestionnaire } from './components/CreateQuestionnaire';
import { Sidebar } from './components/Sidebar';
import { UsersPanel } from './components/UsersPanel';

// QuestionnaireList moved to components/QuestionnaireList.jsx

// CreateQuestionnaire moved to components/CreateQuestionnaire.jsx

// VersionEditor / SectionBlock / QuestionBlock / OptionRow moved to components/*.jsx

export default function AdminApp() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [openVersion, setOpenVersion] = useState(null);

  return (
    <div style={{ padding: '1.25rem', display: 'grid', gap: 24 }}>
      <div className="animate-fade-in" style={{ textAlign: 'center' }}>
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
        <p style={{ color: 'var(--text-muted)' }}>Crea, edita y publica cuestionarios. Administra usuarios por código.</p>
      </div>
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: openVersion ? '360px 1fr' : '380px 1fr' }}>
        <div style={{ display: 'grid', gap: 16, alignSelf: 'start' }}>
          <div className='card'>
            <CreateQuestionnaire onCreated={() => setRefreshSignal(s => s + 1)} />
          </div>
          <div className='card'>
            <UsersPanel />
          </div>
          <Sidebar refreshSignal={refreshSignal} onSelectVersion={setOpenVersion} />
        </div>
        {openVersion && <div className='card'><VersionEditor versionId={openVersion} onClose={() => setOpenVersion(null)} onRefreshList={() => setRefreshSignal(s => s + 1)} /></div>}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Borrador: edita y publica. Las versiones publicadas son inmutables.</p>
    </div>
  );
}
