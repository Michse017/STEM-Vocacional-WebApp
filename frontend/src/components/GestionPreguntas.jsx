import React, { useState, useEffect } from 'react';
import './GestionPreguntas.css';

const GestionPreguntas = ({ cuestionario, onClose }) => {
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalPreguntaAbierto, setModalPreguntaAbierto] = useState(false);
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
    const [modoEdicionPregunta, setModoEdicionPregunta] = useState(false);

    // Estado para el formulario de preguntas
    const [formularioPregunta, setFormularioPregunta] = useState({
        texto_pregunta: '',
        tipo_pregunta: 'text',
        requerida: false,
        opciones: []
    });

    // Estado para gestionar opciones
    const [nuevaOpcion, setNuevaOpcion] = useState('');

    // Obtener URL base
    const getBaseUrl = () => {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5000/api';
        }
        return 'https://stem-backend-9sc0.onrender.com/api';
    };

    useEffect(() => {
        if (cuestionario) {
            cargarPreguntas();
        }
    }, [cuestionario]);

    const cargarPreguntas = async () => {
        try {
            setLoading(true);
            const baseUrl = getBaseUrl();
            console.log('Cargando preguntas para cuestionario:', cuestionario.id_cuestionario);
            const response = await fetch(`${baseUrl}/admin/cuestionarios/${cuestionario.id_cuestionario}`);
            const data = await response.json();
            
            console.log('Respuesta completa del servidor:', data);
            
            if (data.success) {
                console.log('Preguntas recibidas del servidor:', data.data.preguntas);
                // Mapear los campos para que coincidan con lo esperado en el frontend
                const preguntasMapeadas = (data.data.preguntas || []).map(pregunta => ({
                    ...pregunta,
                    texto_pregunta: pregunta.texto || pregunta.texto_pregunta,
                    opciones: (pregunta.opciones || []).map(opcion => ({
                        ...opcion,
                        texto_opcion: opcion.texto || opcion.texto_opcion
                    }))
                }));
                console.log('Preguntas mapeadas:', preguntasMapeadas);
                setPreguntas(preguntasMapeadas);
            } else {
                console.error('Error en la respuesta:', data.error);
                setError('Error al cargar preguntas: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error completo al cargar preguntas:', err);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalPregunta = (pregunta = null) => {
        if (pregunta) {
            // Modo edición
            setModoEdicionPregunta(true);
            setPreguntaSeleccionada(pregunta);
            setFormularioPregunta({
                texto_pregunta: pregunta.texto_pregunta,
                tipo_pregunta: pregunta.tipo_pregunta || 'text',
                requerida: pregunta.requerida || false,
                opciones: pregunta.opciones || []
            });
        } else {
            // Modo creación
            setModoEdicionPregunta(false);
            setPreguntaSeleccionada(null);
            setFormularioPregunta({
                texto_pregunta: '',
                tipo_pregunta: 'text',
                requerida: false,
                opciones: []
            });
        }
        setModalPreguntaAbierto(true);
    };

    const cerrarModalPregunta = () => {
        setModalPreguntaAbierto(false);
        setPreguntaSeleccionada(null);
        setModoEdicionPregunta(false);
        setFormularioPregunta({
            texto_pregunta: '',
            tipo_pregunta: 'text',
            requerida: false,
            opciones: []
        });
        setNuevaOpcion('');
    };

    const manejarCambioPregunta = (e) => {
        const { name, value, type, checked } = e.target;
        setFormularioPregunta(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const agregarOpcion = () => {
        if (nuevaOpcion.trim()) {
            setFormularioPregunta(prev => ({
                ...prev,
                opciones: [...prev.opciones, { texto_opcion: nuevaOpcion.trim() }]
            }));
            setNuevaOpcion('');
        }
    };

    const eliminarOpcion = (index) => {
        setFormularioPregunta(prev => ({
            ...prev,
            opciones: prev.opciones.filter((_, i) => i !== index)
        }));
    };

    const guardarPregunta = async (e) => {
        e.preventDefault();
        
        try {
            const baseUrl = getBaseUrl();
            const url = modoEdicionPregunta 
                ? `${baseUrl}/admin/cuestionarios/${cuestionario.id_cuestionario}/preguntas/${preguntaSeleccionada.id_pregunta}`
                : `${baseUrl}/admin/cuestionarios/${cuestionario.id_cuestionario}/preguntas`;
            
            const method = modoEdicionPregunta ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formularioPregunta,
                    id_cuestionario: cuestionario.id_cuestionario
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                alert(`Pregunta ${modoEdicionPregunta ? 'actualizada' : 'creada'} exitosamente`);
                cerrarModalPregunta();
                cargarPreguntas();
            } else {
                alert('Error al guardar la pregunta: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión al guardar la pregunta');
        }
    };

    const eliminarPregunta = async (pregunta) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la pregunta "${pregunta.texto_pregunta}"?`)) {
            try {
                const baseUrl = getBaseUrl();
                const response = await fetch(`${baseUrl}/admin/cuestionarios/${cuestionario.id_cuestionario}/preguntas/${pregunta.id_pregunta}`, {
                    method: 'DELETE',
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('Pregunta eliminada exitosamente');
                    cargarPreguntas();
                } else {
                    alert('Error al eliminar la pregunta: ' + (data.error || 'Error desconocido'));
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Error de conexión al eliminar la pregunta');
            }
        }
    };

    const tiposPreguntas = [
        { value: 'text', label: 'Texto libre' },
        { value: 'textarea', label: 'Área de texto' },
        { value: 'number', label: 'Número' },
        { value: 'select', label: 'Selección única' },
        { value: 'multiple_choice', label: 'Opción múltiple' },
        { value: 'checkbox', label: 'Casilla de verificación' }
    ];

    if (loading) {
        return (
            <div className="gestion-preguntas-overlay">
                <div className="gestion-preguntas-modal">
                    <div className="loading">Cargando preguntas...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="gestion-preguntas-overlay">
            <div className="gestion-preguntas-modal">
                <div className="modal-header">
                    <h2>Gestionar Preguntas - {cuestionario.nombre}</h2>
                    <button className="btn-cerrar" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="preguntas-toolbar">
                        <button 
                            className="btn btn-primary"
                            onClick={() => abrirModalPregunta()}
                        >
                            <span>+ Nueva Pregunta</span>
                        </button>
                        <span className="preguntas-count">
                            {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="preguntas-lista">
                        {preguntas.length === 0 ? (
                            <div className="empty-state">
                                <p>No hay preguntas creadas aún.</p>
                                <p>Haz clic en "Nueva Pregunta" para agregar la primera.</p>
                            </div>
                        ) : (
                            preguntas.map((pregunta, index) => (
                                <div key={pregunta.id_pregunta} className="pregunta-item">
                                    <div className="pregunta-header">
                                        <span className="pregunta-numero">{index + 1}.</span>
                                        <span className="pregunta-tipo">
                                            [{tiposPreguntas.find(t => t.value === pregunta.tipo_pregunta)?.label || pregunta.tipo_pregunta}]
                                        </span>
                                        {pregunta.requerida && <span className="required-badge">Requerida</span>}
                                    </div>
                                    <div className="pregunta-texto">
                                        {pregunta.texto_pregunta}
                                    </div>
                                    {pregunta.opciones && pregunta.opciones.length > 0 && (
                                        <div className="pregunta-opciones">
                                            <strong>Opciones:</strong>
                                            <ul>
                                                {pregunta.opciones.map((opcion, idx) => (
                                                    <li key={idx}>{opcion.texto_opcion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="pregunta-acciones">
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => abrirModalPregunta(pregunta)}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-sm"
                                            onClick={() => eliminarPregunta(pregunta)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Modal para crear/editar preguntas */}
                {modalPreguntaAbierto && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h3>{modoEdicionPregunta ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
                                <button className="btn-cerrar" onClick={cerrarModalPregunta}>×</button>
                            </div>

                            <form onSubmit={guardarPregunta} className="modal-form">
                                <div className="form-group">
                                    <label htmlFor="texto_pregunta">Texto de la pregunta *</label>
                                    <textarea
                                        id="texto_pregunta"
                                        name="texto_pregunta"
                                        value={formularioPregunta.texto_pregunta}
                                        onChange={manejarCambioPregunta}
                                        required
                                        placeholder="Escribe la pregunta..."
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="tipo_pregunta">Tipo de pregunta</label>
                                    <select
                                        id="tipo_pregunta"
                                        name="tipo_pregunta"
                                        value={formularioPregunta.tipo_pregunta}
                                        onChange={manejarCambioPregunta}
                                        required
                                    >
                                        {tiposPreguntas.map(tipo => (
                                            <option key={tipo.value} value={tipo.value}>
                                                {tipo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="requerida"
                                            checked={formularioPregunta.requerida}
                                            onChange={manejarCambioPregunta}
                                        />
                                        Esta pregunta es requerida
                                    </label>
                                </div>

                                {/* Opciones para preguntas de selección */}
                                {['select', 'multiple_choice'].includes(formularioPregunta.tipo_pregunta) && (
                                    <div className="form-group">
                                        <label>Opciones de respuesta</label>
                                        
                                        <div className="opciones-input">
                                            <input
                                                type="text"
                                                value={nuevaOpcion}
                                                onChange={(e) => setNuevaOpcion(e.target.value)}
                                                placeholder="Nueva opción..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        agregarOpcion();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={agregarOpcion}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Agregar
                                            </button>
                                        </div>

                                        <div className="opciones-lista">
                                            {formularioPregunta.opciones.map((opcion, index) => (
                                                <div key={index} className="opcion-item">
                                                    <span>{opcion.texto_opcion}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarOpcion(index)}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button type="button" onClick={cerrarModalPregunta} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {modoEdicionPregunta ? 'Actualizar' : 'Crear'} Pregunta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestionPreguntas;