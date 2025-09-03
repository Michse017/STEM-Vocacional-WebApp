import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { enviarCuestionario } from "../api";
import { secciones } from "./cuestionarioConfig"; // Importamos la configuración

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
      setFormData({
        sociodemografica: respuestasPrevias.sociodemografica || {},
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

    try {
      const payload = {
        id_usuario: usuario.id_usuario,
        ...formData,
      };
      const resultado = await enviarCuestionario(payload);
      setSuccess(resultado.message || "Respuestas guardadas con éxito.");
      
      setTimeout(() => {
        navigate("/dashboard", { state: { usuario, respuestas: formData } });
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
                
                {/* CORRECCIÓN: La etiqueta <label> solo se muestra para preguntas que no son de tipo 'vf' */}
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
                  // Para el tipo 'vf', el texto de la pregunta ya está dentro del div, así que no necesitamos la label de arriba.
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
