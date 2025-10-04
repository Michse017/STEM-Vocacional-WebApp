import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Cuestionario from "./components/Cuestionario";
import Dashboard from "./components/Dashboard";
import DynamicList from "./components/DynamicList";
import DynamicQuestionnaire from "./components/DynamicQuestionnaire";
import "./styles.css";
// Lazy import (kept after static imports for lint order compliance)
const AdminApp = React.lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <div className="app">
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cuestionario" element={<Cuestionario />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dynamic" element={<DynamicList />} />
            <Route path="/dynamic/:code" element={<DynamicQuestionnaire />} />
            {process.env.REACT_APP_ENABLE_ADMIN === '1' && (
              <Route path="/admin" element={
                <Suspense fallback={<div style={{padding:'2rem'}}>Cargando módulo admin...</div>}>
                  <AdminApp />
                </Suspense>
              } />
            )}
          </Routes>
        </main>
        <footer className="footer">
          STEM Vocational &copy; {new Date().getFullYear()} &middot; Universidad Tecnológica de Bolívar
        </footer>
      </Router>
    </div>
  );
}