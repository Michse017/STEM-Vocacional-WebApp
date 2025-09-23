import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SeleccionCuestionarios = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario } = location.state || {};
    
    const [cuestionarios, setCuestionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para obtener la URL base del backend
    const getBackendUrl = () => {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5000';
        }
        return 'https://stem-backend-9sc0.onrender.com';
    };

    useEffect(() => {
        if (!usuario) {
            navigate('/login');
            return;
        }
        cargarCuestionarios();
    }, [usuario, navigate]);

    const cargarCuestionarios = async () => {
        try {
            setLoading(true);
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/cuestionarios`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setCuestionarios(data.data || []);
            } else {
                setError('Error al cargar cuestionarios');
            }
        } catch (err) {
            console.error('Error al cargar cuestionarios:', err);
            setError('Error de conexión: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarCuestionario = (cuestionario) => {
        // Navegar al cuestionario específico
        navigate('/cuestionario-dinamico', { 
            state: { 
                usuario, 
                cuestionario 
            } 
        });
    };

    const handleLogout = () => {
        navigate('/login', { replace: true });
    };

    if (!usuario) {
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
                    <h2>Acceso denegado</h2>
                    <p>Por favor, inicia sesión para continuar.</p>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Ir a Login
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
            <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "2rem" 
                }}>
                    <div>
                        <h1 style={{
                            fontSize: "2.5rem",
                            fontWeight: "bold",
                            background: "linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            marginBottom: "0.5rem",
                        }}>
                            Cuestionarios Disponibles
                        </h1>
                        <p style={{ 
                            fontSize: "1.125rem", 
                            color: "var(--text-muted-light)" 
                        }}>
                            Hola, <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>
                                {usuario.codigo_estudiante}
                            </span>. Selecciona un cuestionario para responder.
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ minWidth: "120px" }}
                    >
                        Cerrar Sesión
                    </button>
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
                        <p>Cargando cuestionarios...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="card" style={{ 
                        backgroundColor: "#fef2f2", 
                        borderColor: "#fecaca",
                        textAlign: "center",
                        padding: "2rem"
                    }}>
                        <h3 style={{ color: "#dc2626", marginBottom: "1rem" }}>
                            Error al cargar cuestionarios
                        </h3>
                        <p style={{ color: "#991b1b", marginBottom: "1.5rem" }}>
                            {error}
                        </p>
                        <button 
                            onClick={cargarCuestionarios}
                            className="btn btn-primary"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Lista de cuestionarios */}
                {!loading && !error && (
                    <>
                        {cuestionarios.length === 0 ? (
                            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                                <h3 style={{ marginBottom: "1rem" }}>
                                    No hay cuestionarios disponibles
                                </h3>
                                <p style={{ color: "var(--text-muted-light)", marginBottom: "1.5rem" }}>
                                    Actualmente no hay cuestionarios activos para responder.
                                </p>
                                <button 
                                    onClick={cargarCuestionarios}
                                    className="btn btn-secondary"
                                >
                                    Actualizar
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                gap: "1.5rem"
                            }}>
                                {cuestionarios.map((cuestionario) => (
                                    <div 
                                        key={cuestionario.id_cuestionario}
                                        className="card"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                            border: "2px solid transparent"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "var(--primary-color)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "transparent";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                                        }}
                                        onClick={() => seleccionarCuestionario(cuestionario)}
                                    >
                                        <div style={{ marginBottom: "1rem" }}>
                                            <h3 style={{ 
                                                fontSize: "1.25rem", 
                                                fontWeight: "600",
                                                color: "var(--primary-color)",
                                                marginBottom: "0.5rem"
                                            }}>
                                                {cuestionario.nombre}
                                            </h3>
                                            <span style={{
                                                display: "inline-block",
                                                padding: "0.25rem 0.75rem",
                                                backgroundColor: "var(--primary-color)",
                                                color: "white",
                                                borderRadius: "12px",
                                                fontSize: "0.75rem",
                                                fontWeight: "500",
                                                textTransform: "uppercase"
                                            }}>
                                                {cuestionario.tipo}
                                            </span>
                                        </div>

                                        <p style={{ 
                                            color: "var(--text-muted-light)", 
                                            marginBottom: "1rem",
                                            lineHeight: "1.5"
                                        }}>
                                            {cuestionario.descripcion || 'Sin descripción disponible'}
                                        </p>

                                        <div style={{ 
                                            display: "flex", 
                                            justifyContent: "space-between", 
                                            alignItems: "center",
                                            marginBottom: "1rem"
                                        }}>
                                            <div style={{ fontSize: "0.875rem", color: "var(--text-muted-light)" }}>
                                                <span style={{ fontWeight: "500" }}>
                                                    {cuestionario.num_preguntas} preguntas
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted-light)" }}>
                                                {cuestionario.fecha_creacion && 
                                                    new Date(cuestionario.fecha_creacion).toLocaleDateString()
                                                }
                                            </div>
                                        </div>

                                        <button 
                                            className="btn btn-primary"
                                            style={{ width: "100%" }}
                                        >
                                            Responder Cuestionario
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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

export default SeleccionCuestionarios;