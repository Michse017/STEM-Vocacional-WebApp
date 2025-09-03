import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { secciones } from "./cuestionarioConfig";

// Función para contar las preguntas totales en la configuración
const totalPreguntas = secciones.reduce((total, seccion) => {
  return total + seccion.preguntas.length;
}, 0);

const totalPreguntasSocio = secciones.find(s => s.id === 'sociodemografica')?.preguntas.length || 0;
const totalPreguntasIntel = secciones.find(s => s.id === 'inteligencias_multiples')?.preguntas.length || 0;


export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { usuario, respuestas } = location.state || {};

  const handleLogout = () => {
    // Limpiamos el estado y redirigimos al login
    navigate("/login", { replace: true });
  };

  const handleContinue = () => {
    // Navegamos de vuelta al cuestionario con los datos actuales
    navigate("/cuestionario", { state: { usuario, respuestas } });
  };

  if (!usuario || !respuestas) {
    // Si no hay datos, podría ser un acceso directo. Redirigir a login.
    return (
      <div className="dashboard-container">
        <p>No se han cargado datos. Por favor, inicia sesión.</p>
        <button onClick={() => navigate("/login")} className="btn btn-primary">
          Ir a Login
        </button>
      </div>
    );
  }

  // --- Cálculo del Progreso ---
  const respuestasSocio = respuestas.sociodemografica || {};
  const respuestasIntel = respuestas.inteligencias_multiples || {};

  const completadoSocio = Object.values(respuestasSocio).filter(v => v !== null && v !== "").length;
  const progresoSocio = totalPreguntasSocio > 0 ? Math.round((completadoSocio / totalPreguntasSocio) * 100) : 0;

  const completadoIntel = Object.values(respuestasIntel).filter(v => v !== null && v !== "").length;
  const progresoIntel = totalPreguntasIntel > 0 ? Math.round((completadoIntel / totalPreguntasIntel) * 100) : 0;

  const completadoTotal = completadoSocio + completadoIntel;
  const progresoTotal = totalPreguntas > 0 ? Math.round((completadoTotal / totalPreguntas) * 100) : 0;


  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <h1>Resumen de tu Progreso</h1>
        <p>Hola, <strong>{usuario.codigo_estudiante}</strong>. Aquí puedes ver cuánto has avanzado.</p>
      </div>

      <div className="summary-card">
        <h2>Progreso General</h2>
        <div className="progress-section">
          <div className="progress-info">
            <span>{progresoTotal}% completado</span>
            <span>{completadoTotal} de {totalPreguntas} preguntas</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progresoTotal}%` }}></div>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h2>Progreso por Sección</h2>
        <div className="progress-section">
          <p>Información Sociodemográfica</p>
          <div className="progress-info">
            <span>{progresoSocio}%</span>
            <span>{completadoSocio} de {totalPreguntasSocio}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progresoSocio}%` }}></div>
          </div>
        </div>
        <div className="progress-section">
          <p>Test de Inteligencias Múltiples</p>
          <div className="progress-info">
            <span>{progresoIntel}%</span>
            <span>{completadoIntel} de {totalPreguntasIntel}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progresoIntel}%` }}></div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={handleContinue} className="btn btn-primary">
          {progresoTotal === 100 ? "Revisar Cuestionario" : "Continuar Cuestionario"}
        </button>
        <button onClick={handleLogout} className="btn btn-secondary">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
