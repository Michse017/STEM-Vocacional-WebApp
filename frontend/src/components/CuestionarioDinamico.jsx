import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CuestionarioDinamico = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, cuestionario } = location.state || {};
    
    const [cuestionarioCompleto, setCuestionarioCompleto] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [success, setSuccess] = useState('');

    // Función para obtener la URL base del backend
    const getBackendUrl = () => {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5000';
        }
        return 'https://stem-backend-9sc0.onrender.com';
    };

    useEffect(() => {
        if (!usuario || !cuestionario) {
            navigate('/dashboard-cuestionarios', { state: { usuario } });
            return;
        }
        cargarCuestionarioCompleto();
    }, [usuario, cuestionario, navigate]);

    const cargarCuestionarioCompleto = async () => {
        try {
            setLoading(true);
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/cuestionarios/${cuestionario.id_cuestionario}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setCuestionarioCompleto(data.data);
                // Inicializar respuestas vacías
                const respuestasIniciales = {};
                data.data.preguntas.forEach(pregunta => {
                    respuestasIniciales[pregunta.id_pregunta] = '';
                });
                setRespuestas(respuestasIniciales);
            } else {
                setError('Error al cargar el cuestionario');
            }
        } catch (err) {
            console.error('Error al cargar cuestionario:', err);
            setError('Error de conexión: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const manejarCambioRespuesta = (idPregunta, valor) => {
        setRespuestas(prev => ({
            ...prev,
            [idPregunta]: valor
        }));
    };

    const enviarRespuestas = async () => {
        try {
            setEnviando(true);
            setError('');
            
            // Validar respuestas requeridas
            const preguntasRequeridas = cuestionarioCompleto.preguntas.filter(p => p.requerida);
            const respuestasFaltantes = preguntasRequeridas.filter(p => 
                !respuestas[p.id_pregunta] || respuestas[p.id_pregunta].trim() === ''
            );
            
            if (respuestasFaltantes.length > 0) {
                setError(`Por favor completa todas las preguntas requeridas (${respuestasFaltantes.length} pendientes)`);
                return;
            }

            const payload = {
                id_usuario: usuario.id_usuario,
                id_cuestionario: cuestionario.id_cuestionario,
                respuestas: respuestas
            };

            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/cuestionario-dinamico`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setSuccess('¡Respuestas enviadas exitosamente!');
                setTimeout(() => {
                    navigate('/dashboard-cuestionarios', { 
                        state: { 
                            usuario,
                            mensaje: `Has completado "${cuestionario.nombre}" exitosamente.`
                        } 
                    });
                }, 2000);
            } else {
                setError(data.error || 'Error al enviar respuestas');
            }
        } catch (err) {
            console.error('Error al enviar respuestas:', err);
            setError('Error de conexión: ' + err.message);
        } finally {
            setEnviando(false);
        }
    };

    const renderPregunta = (pregunta) => {
        const valor = respuestas[pregunta.id_pregunta] || '';

        switch (pregunta.tipo_pregunta) {
            case 'multiple_choice':
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {pregunta.opciones.map((opcion) => (
                            <label key={opcion.id_opcion} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.5rem",
                                cursor: "pointer",
                                padding: "0.5rem",
                                borderRadius: "6px",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <input
                                    type="radio"
                                    name={`pregunta_${pregunta.id_pregunta}`}
                                    value={opcion.valor || opcion.texto_opcion}
                                    checked={valor === (opcion.valor || opcion.texto_opcion)}
                                    onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                                    style={{ marginRight: "0.5rem" }}
                                />
                                {opcion.texto_opcion}
                            </label>
                        ))}
                    </div>
                );

            case 'text':
            case 'short_text':
                return (
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="form-input"
                        style={{ width: "100%" }}
                    />
                );

            case 'textarea':
            case 'long_text':
                return (
                    <textarea
                        value={valor}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                        placeholder="Escribe tu respuesta detallada..."
                        className="form-input"
                        rows={4}
                        style={{ width: "100%", resize: "vertical" }}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={valor}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                        placeholder="Ingresa un número..."
                        className="form-input"
                        style={{ width: "100%" }}
                    />
                );

            case 'select':
                return (
                    <select
                        value={valor}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                        className="form-input"
                        style={{ width: "100%" }}
                    >
                        <option value="">Selecciona una opción...</option>
                        {pregunta.opciones.map((opcion) => (
                            <option key={opcion.id_opcion} value={opcion.valor || opcion.texto_opcion}>
                                {opcion.texto_opcion}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {pregunta.opciones.map((opcion) => {
                            const valoresSeleccionados = valor ? valor.split(',') : [];
                            const estaSeleccionado = valoresSeleccionados.includes(opcion.valor || opcion.texto_opcion);
                            
                            return (
                                <label key={opcion.id_opcion} style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    borderRadius: "6px",
                                    transition: "background-color 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <input
                                        type="checkbox"
                                        checked={estaSeleccionado}
                                        onChange={(e) => {
                                            const valorOpcion = opcion.valor || opcion.texto_opcion;
                                            let nuevosValores = valoresSeleccionados.filter(v => v !== valorOpcion);
                                            if (e.target.checked) {
                                                nuevosValores.push(valorOpcion);
                                            }
                                            manejarCambioRespuesta(pregunta.id_pregunta, nuevosValores.join(','));
                                        }}
                                        style={{ marginRight: "0.5rem" }}
                                    />
                                    {opcion.texto_opcion}
                                </label>
                            );
                        })}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => manejarCambioRespuesta(pregunta.id_pregunta, e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="form-input"
                        style={{ width: "100%" }}
                    />
                );
        }
    };

    if (!usuario || !cuestionario) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <h2>Error de acceso</h2>
                    <p>No se pudo cargar la información del cuestionario.</p>
                    <button onClick={() => navigate('/dashboard-cuestionarios')} className="btn btn-primary">
                        Volver a Cuestionarios
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
            padding: "2rem 1rem",
        }}>
            <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <button 
                        onClick={() => navigate('/dashboard-cuestionarios', { state: { usuario } })}
                        className="btn btn-secondary"
                        style={{ marginBottom: "1rem" }}
                    >
                        ← Volver a Cuestionarios
                    </button>
                    
                    <h1 style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: "var(--primary-color)",
                        marginBottom: "0.5rem",
                    }}>
                        {cuestionario.nombre}
                    </h1>
                    
                    {cuestionario.descripcion && (
                        <p style={{ 
                            fontSize: "1.125rem", 
                            color: "var(--text-muted-light)",
                            marginBottom: "1rem"
                        }}>
                            {cuestionario.descripcion}
                        </p>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                        <div style={{ 
                            display: "inline-block",
                            width: "2rem",
                            height: "2rem",
                            border: "3px solid var(--border-color)",
                            borderTop: "3px solid var(--primary-color)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            marginBottom: "1rem"
                        }}></div>
                        <p>Cargando cuestionario...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="card" style={{ 
                        backgroundColor: "#fef2f2", 
                        borderColor: "#fecaca",
                        marginBottom: "1.5rem"
                    }}>
                        <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="card" style={{ 
                        backgroundColor: "#f0fdf4", 
                        borderColor: "#bbf7d0",
                        marginBottom: "1.5rem"
                    }}>
                        <p style={{ color: "#166534", margin: 0 }}>{success}</p>
                    </div>
                )}

                {/* Formulario del cuestionario */}
                {!loading && cuestionarioCompleto && (
                    <div className="card">
                        <form onSubmit={(e) => { e.preventDefault(); enviarRespuestas(); }}>
                            {cuestionarioCompleto.preguntas.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem" }}>
                                    <h3>Cuestionario en desarrollo</h3>
                                    <p style={{ color: "var(--text-muted-light)" }}>
                                        Este cuestionario aún no tiene preguntas configuradas.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {cuestionarioCompleto.preguntas
                                        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                        .map((pregunta, index) => (
                                        <div key={pregunta.id_pregunta} style={{ marginBottom: "2rem" }}>
                                            <div style={{ marginBottom: "1rem" }}>
                                                <label style={{ 
                                                    display: "block",
                                                    fontSize: "1.125rem",
                                                    fontWeight: "600",
                                                    color: "var(--text-color)",
                                                    marginBottom: "0.5rem"
                                                }}>
                                                    {index + 1}. {pregunta.texto_pregunta}
                                                    {pregunta.requerida && (
                                                        <span style={{ color: "#dc2626", marginLeft: "0.25rem" }}>*</span>
                                                    )}
                                                </label>
                                                {pregunta.requerida && (
                                                    <p style={{ 
                                                        fontSize: "0.875rem", 
                                                        color: "var(--text-muted-light)",
                                                        margin: "0 0 0.5rem 0"
                                                    }}>
                                                        Campo obligatorio
                                                    </p>
                                                )}
                                            </div>
                                            {renderPregunta(pregunta)}
                                        </div>
                                    ))}

                                    <div style={{ 
                                        display: "flex", 
                                        gap: "1rem", 
                                        justifyContent: "flex-end",
                                        paddingTop: "2rem",
                                        borderTop: "1px solid var(--border-color)"
                                    }}>
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/dashboard-cuestionarios', { state: { usuario } })}
                                            className="btn btn-secondary"
                                            disabled={enviando}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={enviando}
                                            style={{ minWidth: "150px" }}
                                        >
                                            {enviando ? "Enviando..." : "Enviar Respuestas"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default CuestionarioDinamico;