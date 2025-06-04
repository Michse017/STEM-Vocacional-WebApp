import React, { useState } from "react";
import "./ValidationQuestionnaire.css";

const sections = [
  {
    key: "cognitiva",
    title: "1. Dimensión Cognitiva",
    description:
      "Confirma o actualiza información sobre tus pruebas académicas y promedios.",
    questions: [
      {
        label:
          "¿Presentaste las pruebas Saber 11 o ICFES después de 2014? ¿Tienes los resultados oficiales?",
        name: "icfes_reciente",
        type: "text",
      },
      {
        label:
          "¿Tus pruebas incluyen resultados en áreas sociales o humanísticas? ¿Puedes confirmar el año?",
        name: "sociales_humanisticas",
        type: "text",
      },
      {
        label:
          "¿Incluyeron lectura crítica, lenguaje e inglés en tus pruebas Saber 11?",
        name: "lectura_lenguaje_ingles",
        type: "text",
      },
      {
        label: "¿Has presentado la prueba Saber Pro (ECAES)? ¿En qué año?",
        name: "ecaes_ano",
        type: "text",
      },
      {
        label:
          "¿Cuál es tu promedio acumulado actual y del último semestre? ¿Hay registros oficiales disponibles?",
        name: "promedios",
        type: "text",
      },
    ],
  },
  {
    key: "educativa",
    title: "2. Dimensión Educativa/Familiar",
    description:
      "Actualiza los datos sobre tu colegio y trayectoria educativa.",
    questions: [
      {
        label:
          "¿Dónde cursaste el bachillerato? ¿Recuerdas si fue técnico, académico, rural o urbano?",
        name: "colegio_info",
        type: "text",
      },
      {
        label: "¿En qué año te graduaste del colegio?",
        name: "fecha_graduacion",
        type: "text",
      },
    ],
  },
  {
    key: "socioeconomica",
    title: "3. Dimensión Socioeconómica",
    description:
      "Valida o actualiza tu información socioeconómica y apoyos recibidos.",
    questions: [
      {
        label: "¿Cuál es el estrato socioeconómico de tu vivienda actual?",
        name: "estrato",
        type: "text",
      },
      {
        label:
          "¿Actualmente cuentas con alguna beca o ayuda económica? ¿Cuál?",
        name: "becas",
        type: "text",
      },
      {
        label:
          "¿Estás vinculado(a) a algún programa Ceres u otro programa especial?",
        name: "ceres",
        type: "text",
      },
      {
        label:
          "¿Cuándo ingresaste a la universidad? ¿Eres estudiante nuevo, de transferencia o reintegrado?",
        name: "periodo_ingreso_tipo",
        type: "text",
      },
    ],
  },
  {
    key: "autoeficacia",
    title: "4. Dimensión de Autoeficacia",
    description:
      "Verifica tu estado actual y logros en la universidad.",
    questions: [
      {
        label:
          "¿Cuál es tu estado actual en la universidad? ¿Activo, en pausa, retirado, egresado?",
        name: "estado_actual",
        type: "text",
      },
    ],
  },
];

export default function ValidationQuestionnaire() {
  const [openSection, setOpenSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = (idx) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Cambia la URL por la de tu endpoint real
    try {
      const response = await fetch("/api/cuestionarios/validation/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Error al enviar el cuestionario.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="validation-container">
        <h2>¡Cuestionario enviado correctamente!</h2>
        <p>Gracias por validar tu información.</p>
      </div>
    );
  }

  return (
    <div className="validation-container">
      <h1>Cuestionario de Validación de Datos Académicos y Personales</h1>
      <form onSubmit={handleSubmit}>
        {sections.map((section, idx) => (
          <div key={section.key} className="validation-section">
            <button
              type="button"
              className="section-toggle"
              onClick={() => handleToggle(idx)}
              aria-expanded={openSection === idx}
            >
              <span className="section-title">{section.title}</span>
              <span className="chevron">{openSection === idx ? "▲" : "▼"}</span>
            </button>
            {openSection === idx && (
              <div className="section-content">
                <p className="section-description">{section.description}</p>
                {section.questions.map((q) => (
                  <div key={q.name} className="form-group">
                    <label htmlFor={q.name}>{q.label}</label>
                    <input
                      type={q.type}
                      id={q.name}
                      name={q.name}
                      value={formData[q.name] || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar cuestionario"}
        </button>
      </form>
    </div>
  );
}