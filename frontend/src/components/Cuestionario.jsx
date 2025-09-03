import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { enviarCuestionario } from "../api";
import { secciones } from "./cuestionarioConfig"; // Importamos la configuración

/**
 * Formatea una cadena de fecha (de la DB o de un input) al formato YYYY-MM-DD.
 * @param {string} dateString - La fecha en formato ISO o similar.
 * @returns {string} La fecha en formato YYYY-MM-DD.
 */
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  // Toma la parte de la fecha antes de la 'T' si es un formato ISO completo.
  return dateString.split('T')[0];
};


export default function Cuestionario() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { usuario, respuestas: respuestasPrevias } = location.state || {};

  const [formData, setFormData] = useState({
    sociodemografica: {},
    inteligencias_multiples: {},
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (respuestasPrevias) {
      const socioData = { ...(respuestasPrevias.sociodemografica || {}) };

      // Convertir todos los valores de sociodemografica a string para los inputs
      Object.keys(socioData).forEach(key => {
        if (socioData[key] !== null && socioData[key] !== undefined) {
          socioData[key] = String(socioData[key]);
        }
      });
      
      // Formatear las fechas que vienen de la DB para que el input las muestre
      if (socioData.fecha_nacimiento) {
        socioData.fecha_nacimiento = formatDateForInput(socioData.fecha_nacimiento);
      }
      if (socioData.fecha_graduacion_bachillerato) {
        socioData.fecha_graduacion_bachillerato = formatDateForInput(socioData.fecha_graduacion_bachillerato);
      }

      setFormData({
        sociodemografica: socioData,
        inteligencias_multiples: respuestasPrevias.inteligencias_multiples || {},
      });
    }
  }, [usuario, respuestasPrevias, navigate]);

  const handleChange = (seccion, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // --- LIMPIEZA Y PREPARACIÓN DE DATOS ANTES DE ENVIAR ---
    const cleanedSociodemografica = { ...formData.sociodemografica };

    // 1. Convertir puntajes a números. Si están vacíos o no son válidos, se envían como 0.
    const puntajes = [
      'puntaje_global_saber11', 'puntaje_matematicas', 'puntaje_lectura_critica',
      'puntaje_ciencias_naturales', 'puntaje_competencias_ciudadanas', 'puntaje_ingles'
    ];
    puntajes.forEach(puntaje => {
      cleanedSociodemografica[puntaje] = parseInt(cleanedSociodemografica[puntaje] || 0, 10);
    });

    // 2. Asegurar que las fechas se envíen en el formato correcto (YYYY-MM-DD)
    if (cleanedSociodemografica.fecha_nacimiento) {
      cleanedSociodemografica.fecha_nacimiento = formatDateForInput(cleanedSociodemografica.fecha_nacimiento);
    }
    if (cleanedSociodemografica.fecha_graduacion_bachillerato) {
      cleanedSociodemografica.fecha_graduacion_bachillerato = formatDateForInput(cleanedSociodemografica.fecha_graduacion_bachillerato);
    }
    
    try {
      const payload = {
        id_usuario: usuario.id_usuario,
        sociodemografica: cleanedSociodemografica,
        inteligencias_multiples: formData.inteligencias_multiples,
      };

      const resultado = await enviarCuestionario(payload);
      setSuccess(resultado.message || "Respuestas guardadas con éxito.");
      
      setTimeout(() => {
        // CORRECCIÓN: Navegamos con los datos del payload que ya están limpios
        navigate("/dashboard", { state: { usuario, respuestas: payload } });
      }, 1500);

    } catch (err) {
      setError(err.message || "Error al guardar las respuestas.");
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="cuestionario-container animate-fade-in">
      <h1>Cuestionario de Orientación Vocacional</h1>
      <p>
        Hola, {usuario.codigo_estudiante}. Por favor, completa las siguientes
        secciones. Puedes guardar tu progreso en cualquier momento.
      </p>
      <form onSubmit={handleSubmit}>
        {secciones.map(seccion => (
          <fieldset key={seccion.id}>
            <legend>{seccion.titulo}</legend>
            {seccion.preguntas.map(pregunta => (
              <div key={pregunta.id} className="form-group">
                
                {pregunta.tipo !== 'vf' && (
                  <label htmlFor={pregunta.id}>{pregunta.texto}</label>
                )}

                {pregunta.tipo === "select" && (
                  <select
                    id={pregunta.id}
                    value={formData[seccion.id]?.[pregunta.id] || ""}
                    onChange={(e) =>
                      handleChange(seccion.id, pregunta.id, e.target.value)
                    }
                  >
                    <option value="">Selecciona una opción</option>
                    {pregunta.opciones.map(opcion => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.texto}
                      </option>
                    ))}
                  </select>
                )}
                {pregunta.tipo === "date" && (
                  <input
                    type="date"
                    id={pregunta.id}
                    value={formData[seccion.id]?.[pregunta.id] || ""}
                    onChange={(e) =>
                      handleChange(seccion.id, pregunta.id, e.target.value)
                    }
                  />
                )}
                {pregunta.tipo === "number" && (
                  <input
                    type="number"
                    id={pregunta.id}
                    value={formData[seccion.id]?.[pregunta.id] || ""}
                    onChange={(e) =>
                      handleChange(seccion.id, pregunta.id, e.target.value)
                    }
                    min={pregunta.min}
                    max={pregunta.max}
                  />
                )}
                {pregunta.tipo === "vf" && (
                  <div className="pregunta-vf">
                    <p>{pregunta.texto}</p>
                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          name={pregunta.id}
                          value="V"
                          checked={
                            formData.inteligencias_multiples?.[pregunta.id] === "V"
                          }
                          onChange={(e) =>
                            handleChange(
                              "inteligencias_multiples",
                              pregunta.id,
                              e.target.value
                            )
                          }
                        />
                        Verdadero
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={pregunta.id}
                          value="F"
                          checked={
                            formData.inteligencias_multiples?.[pregunta.id] === "F"
                          }
                          onChange={(e) =>
                            handleChange(
                              "inteligencias_multiples",
                              pregunta.id,
                              e.target.value
                            )
                          }
                        />
                        Falso
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </fieldset>
        ))}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Progreso e Ir al Dashboard"}
        </button>
      </form>
    </div>
  );
}
