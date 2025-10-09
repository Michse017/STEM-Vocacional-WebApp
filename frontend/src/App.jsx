import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
// Removed legacy hardcoded questionnaire in favor of dynamic primary
import Dashboard from "./components/Dashboard";
import DynamicList from "./components/DynamicList";
import DynamicQuestionnaire from "./components/DynamicQuestionnaire";
import DynamicQuestionnaireRedirect from "./components/DynamicQuestionnaireRedirect";
import "./styles.css";
// Lazy import (kept after static imports for lint order compliance)
const AdminApp = React.lazy(() => import('./admin/AdminApp'));
const AdminLogin = React.lazy(() => import('./admin/AdminLogin'));

function AdminRoute() {
  const [me, setMe] = useState(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Attempt to fetch profile; api wrapper will include token if present
        const mod = await import('./admin/api');
        const { api } = mod;
        const profile = await api('/auth/admin/me');
        if (mounted) setMe(profile);
      } catch (_) {
        // Limpia token inválido para evitar bucles si quedó un admin_token viejo
        try { localStorage.removeItem('admin_token'); } catch (_) {}
        if (mounted) setMe(null);
      } finally {
        if (mounted) setChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!checked) {
    return <div style={{padding:'2rem'}}>Cargando...</div>;
  }
  if (!me) {
    return (
      <Suspense fallback={<div style={{padding:'2rem'}}>Cargando login...</div>}> 
        <AdminLogin onLoggedIn={setMe} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<div style={{padding:'2rem'}}>Cargando módulo admin...</div>}> 
      <AdminApp />
    </Suspense>
  );
}

function StudentRoute({ element }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('usuario') || 'null');
      if (u && u.id_usuario) setUser(u);
    } catch (_) {}
    setChecked(true);
  }, []);
  if (!checked) return <div style={{padding:'2rem'}}>Cargando...</div>;
  if (!user) return <Login />;
  return element;
}

export default function App() {
  const enableAdmin = String(process.env.REACT_APP_ENABLE_ADMIN || process.env.react_app_enable_admin || "1") === "1";
  return (
    <div className="app">
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            {/* Legacy route kept as redirect to dynamic primary for compatibility */}
            <Route path="/cuestionario" element={<StudentRoute element={<DynamicQuestionnaireRedirect />} />} />
            <Route path="/dashboard" element={<StudentRoute element={<Dashboard />} />} />
            <Route path="/dynamic" element={<DynamicList />} />
            <Route path="/dynamic/:code" element={<DynamicQuestionnaire />} />
            {enableAdmin ? (
              <Route path="/admin" element={<AdminRoute />} />
            ) : (
              // Si admin está deshabilitado, cualquier intento de ir a /admin vuelve al landing
              <Route path="/admin" element={<Navigate to="/" replace />} />
            )}
            {/* Catch-all: vuelve al landing para rutas desconocidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="footer">
          STEM Vocational &copy; {new Date().getFullYear()} &middot; Universidad Tecnológica de Bolívar
        </footer>
      </Router>
    </div>
  );
}