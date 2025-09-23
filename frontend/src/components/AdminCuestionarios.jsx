import React, { useState, useEffect } from 'react';
import './AdminCuestionarios.css';
import GestionPreguntas from './GestionPreguntas';

const AdminCuestionarios = () => {
    const [cuestionarios, setCuestionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cuestionarioSeleccionado, setCuestionarioSeleccionado] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [gestionPreguntasAbierto, setGestionPreguntasAbierto] = useState(false);
    const [cuestionarioPreguntasSeleccionado, setCuestionarioPreguntasSeleccionado] = useState(null);

    // Estado para preguntas en el formulario
    const [preguntasFormulario, setPreguntasFormulario] = useState([]);
    const [nuevaPregunta, setNuevaPregunta] = useState({
        texto_pregunta: '',
        tipo_pregunta: 'text',
        requerida: false,
        opciones: []
    });
    const [nuevaOpcion, setNuevaOpcion] = useState('');
    const [modo, setModo] = useState('unknown'); // 'mock', 'database', 'unknown'

    // Estados para el formulario
    const [formulario, setFormulario] = useState({
        nombre: '',
        descripcion: '',
        tipo: ''
    });

    // Determinar la URL base según el entorno
    const getBaseUrl = () => {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5000/api';
        }
        // En producción, usar la URL completa del backend en Render
        return 'https://stem-backend-9sc0.onrender.com/api';
    };

    // Cargar cuestionarios al montar el componente
    useEffect(() => {
        cargarCuestionarios();
    }, []);

    const cargarCuestionarios = async () => {
        try {
            setLoading(true);
            const baseUrl = getBaseUrl();
            const response = await fetch(`${baseUrl}/admin/cuestionarios`);
            const data = await response.json();
            
            if (data.success) {
                setCuestionarios(data.data);
                setModo(data.mode || 'unknown');
            } else {
                setError('Error al cargar cuestionarios');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = (cuestionario = null) => {
        console.log('=== ABRIENDO MODAL ===');
        console.log('Cuestionario para editar:', cuestionario);
        console.log('preguntasFormulario actual antes de abrir modal:', preguntasFormulario);
        
        if (cuestionario) {
            // Modo edición
            console.log('Modo: EDICIÓN');
            setModoEdicion(true);
            setCuestionarioSeleccionado(cuestionario);
            setFormulario({
                nombre: cuestionario.nombre,
                descripcion: cuestionario.descripcion || '',
                tipo: cuestionario.tipo || ''
            });
            // TODO: Cargar preguntas existentes para edición
            setPreguntasFormulario([]);
        } else {
            // Modo creación
            console.log('Modo: CREACIÓN');
            setModoEdicion(false);
            setCuestionarioSeleccionado(null);
            setFormulario({
                nombre: '',
                descripcion: '',
                tipo: ''
            });
            // NO resetear preguntasFormulario aquí para modo creación
            // El usuario puede ya haber agregado preguntas
            console.log('NO reseteando preguntasFormulario para modo creación');
        }
        setModalAbierto(true);
        console.log('preguntasFormulario después de abrir modal:', preguntasFormulario);
    };

    const cerrarModal = () => {
        console.log('=== CERRANDO MODAL ===');
        console.log('preguntasFormulario al cerrar:', preguntasFormulario);
        
        setModalAbierto(false);
        setCuestionarioSeleccionado(null);
        setModoEdicion(false);
        setFormulario({
            nombre: '',
            descripcion: '',
            tipo: ''
        });
        // Resetear preguntas al cerrar modal (cancelar)
        setPreguntasFormulario([]);
        setNuevaPregunta({
            texto_pregunta: '',
            tipo_pregunta: 'text',
            requerida: false,
            opciones: []
        });
        setNuevaOpcion('');
        console.log('Modal cerrado y estado reseteado');
    };

    const manejarCambioFormulario = (e) => {
        const { name, value } = e.target;
        setFormulario(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const guardarCuestionario = async (e) => {
        e.preventDefault();
        
        try {
            const baseUrl = getBaseUrl();
            const url = modoEdicion 
                ? `${baseUrl}/admin/cuestionarios/${cuestionarioSeleccionado.id_cuestionario}`
                : `${baseUrl}/admin/cuestionarios`;
            
            const method = modoEdicion ? 'PUT' : 'POST';
            
            // DEBUG: Verificar estado antes de crear payload
            console.log('=== DEBUG FRONTEND ===');
            console.log('preguntasFormulario estado actual:', preguntasFormulario);
            console.log('Número de preguntas en formulario:', preguntasFormulario.length);
            preguntasFormulario.forEach((pregunta, index) => {
                console.log(`Pregunta ${index + 1}:`, pregunta);
            });
            
            // Incluir preguntas en el payload
            const payload = {
                ...formulario,
                preguntas: preguntasFormulario.map((pregunta, index) => ({
                    texto_pregunta: pregunta.texto_pregunta,
                    tipo_pregunta: pregunta.tipo_pregunta,
                    requerida: pregunta.requerida,
                    orden: index + 1,
                    opciones: pregunta.opciones || []
                }))
            };
            
            console.log('Payload completo a enviar:', payload);
            console.log('Preguntas en payload:', payload.preguntas);
            console.log('Número de preguntas a enviar:', payload.preguntas.length);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            console.log('Respuesta del servidor:', data); // Debug
            
            if (data.success) {
                cerrarModal();
                await cargarCuestionarios(); // Recargar la lista y esperar a que termine
                
                // Resetear preguntas después de guardar exitosamente
                console.log('Guardado exitoso, reseteando preguntasFormulario');
                setPreguntasFormulario([]);
                
                const mensaje = data.mode === 'mock' 
                    ? `${modoEdicion ? 'Cuestionario actualizado' : 'Cuestionario creado'} (modo demostración)`
                    : `${modoEdicion ? 'Cuestionario actualizado' : 'Cuestionario creado'} exitosamente con ${preguntasFormulario.length} preguntas`;
                alert(mensaje);
                console.log('Cuestionario guardado:', data.data);
            } else {
                console.error('Error del servidor:', data);
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al guardar el cuestionario');
        }
    };

    const eliminarCuestionario = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este cuestionario?')) {
            return;
        }

        try {
            const baseUrl = getBaseUrl();
            const response = await fetch(`${baseUrl}/admin/cuestionarios/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                cargarCuestionarios(); // Recargar la lista
                const mensaje = data.mode === 'mock' 
                    ? 'Cuestionario eliminado (modo demostración)'
                    : 'Cuestionario eliminado exitosamente';
                alert(mensaje);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al eliminar el cuestionario');
        }
    };

    const verPreguntas = (cuestionario) => {
        setCuestionarioPreguntasSeleccionado(cuestionario);
        setGestionPreguntasAbierto(true);
    };

    // Funciones para manejar preguntas en el formulario
    const manejarCambioNuevaPregunta = (e) => {
        const { name, value, type, checked } = e.target;
        setNuevaPregunta(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const agregarOpcionPregunta = () => {
        if (nuevaOpcion.trim()) {
            setNuevaPregunta(prev => ({
                ...prev,
                opciones: [...prev.opciones, { texto_opcion: nuevaOpcion.trim() }]
            }));
            setNuevaOpcion('');
        }
    };

    const eliminarOpcionPregunta = (index) => {
        setNuevaPregunta(prev => ({
            ...prev,
            opciones: prev.opciones.filter((_, i) => i !== index)
        }));
    };

    const agregarPreguntaAlFormulario = () => {
        console.log('=== AGREGANDO PREGUNTA AL FORMULARIO ===');
        console.log('nuevaPregunta actual:', nuevaPregunta);
        console.log('preguntasFormulario antes de agregar:', preguntasFormulario);
        
        if (nuevaPregunta.texto_pregunta.trim()) {
            const preguntaAAgregar = {
                ...nuevaPregunta,
                id_temporal: Date.now() // ID temporal para React key
            };
            
            console.log('Pregunta que se va a agregar:', preguntaAAgregar);
            
            setPreguntasFormulario(prev => {
                const nuevaLista = [...prev, preguntaAAgregar];
                console.log('Nueva lista de preguntas después de agregar:', nuevaLista);
                return nuevaLista;
            });
            
            setNuevaPregunta({
                texto_pregunta: '',
                tipo_pregunta: 'text',
                requerida: false,
                opciones: []
            });
            
            console.log('Pregunta agregada exitosamente');
        } else {
            console.log('ERROR: No se puede agregar pregunta vacía');
        }
    };

    const eliminarPreguntaDelFormulario = (idTemporal) => {
        console.log('=== ELIMINANDO PREGUNTA DEL FORMULARIO ===');
        console.log('ID temporal a eliminar:', idTemporal);
        console.log('preguntasFormulario antes de eliminar:', preguntasFormulario);
        
        setPreguntasFormulario(prev => {
            const nuevaLista = prev.filter(p => p.id_temporal !== idTemporal);
            console.log('Nueva lista de preguntas después de eliminar:', nuevaLista);
            return nuevaLista;
        });
    };

    if (loading) {
        return (
            <div className="admin-cuestionarios">
                <div className="loading">Cargando cuestionarios...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-cuestionarios">
                <div className="error">{error}</div>
                <button onClick={cargarCuestionarios} className="btn-reintentar">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="admin-cuestionarios">
            <div className="header">
                <div>
                    <h1>Administración de Cuestionarios</h1>
                    {modo !== 'unknown' && (
                        <div className={`modo-indicador ${modo}`}>
                            {modo === 'mock' ? '🧪 Modo Demostración' : '🔗 Conectado a Base de Datos'}
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => abrirModal()} 
                    className="btn-primary"
                >
                    + Crear Cuestionario
                </button>
            </div>

            <div className="cuestionarios-grid">
                {cuestionarios.length === 0 ? (
                    <div className="no-cuestionarios">
                        <p>No hay cuestionarios creados.</p>
                        <button onClick={() => abrirModal()} className="btn-primary">
                            Crear el primer cuestionario
                        </button>
                    </div>
                ) : (
                    cuestionarios.map(cuestionario => (
                        <div key={cuestionario.id_cuestionario} className="cuestionario-card">
                            <div className="card-header">
                                <h3>{cuestionario.nombre}</h3>
                                <span className={`estado ${cuestionario.activo ? 'activo' : 'inactivo'}`}>
                                    {cuestionario.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            
                            <div className="card-body">
                                {cuestionario.descripcion && (
                                    <p className="descripcion">{cuestionario.descripcion}</p>
                                )}
                                
                                {cuestionario.tipo && (
                                    <div className="tipo">
                                        <strong>Tipo:</strong> {cuestionario.tipo}
                                    </div>
                                )}
                                
                                <div className="fecha">
                                    <small>
                                        Creado: {new Date(cuestionario.fecha_creacion).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                            
                            <div className="card-actions">
                                <button 
                                    onClick={() => verPreguntas(cuestionario)}
                                    className="btn-secondary"
                                >
                                    Ver Preguntas
                                </button>
                                <button 
                                    onClick={() => abrirModal(cuestionario)}
                                    className="btn-secondary"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => eliminarCuestionario(cuestionario.id_cuestionario)}
                                    className="btn-danger"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para crear/editar cuestionario */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{modoEdicion ? 'Editar Cuestionario' : 'Crear Cuestionario'}</h2>
                            <button onClick={cerrarModal} className="btn-close">×</button>
                        </div>
                        
                        <form onSubmit={guardarCuestionario} className="modal-body">
                            <div className="campo">
                                <label htmlFor="nombre">Nombre del Cuestionario *</label>
                                <input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={manejarCambioFormulario}
                                    required
                                    placeholder="Ingresa el nombre del cuestionario"
                                />
                            </div>
                            
                            <div className="campo">
                                <label htmlFor="descripcion">Descripción</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formulario.descripcion}
                                    onChange={manejarCambioFormulario}
                                    placeholder="Descripción opcional del cuestionario"
                                    rows={3}
                                />
                            </div>
                            
                            <div className="campo">
                                <label htmlFor="tipo">Tipo de Cuestionario</label>
                                <select
                                    id="tipo"
                                    name="tipo"
                                    value={formulario.tipo}
                                    onChange={manejarCambioFormulario}
                                >
                                    <option value="">Seleccionar tipo</option>
                                    <option value="sociodemografico">Sociodemográfico</option>
                                    <option value="inteligencias_multiples">Inteligencias Múltiples</option>
                                    <option value="personalidad">Personalidad</option>
                                    <option value="vocacional">Vocacional</option>
                                    <option value="academico">Académico</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Sección de Preguntas */}
                            <div className="campo-preguntas">
                                <h3>Preguntas del Cuestionario</h3>
                                
                                {/* Lista de preguntas agregadas */}
                                {preguntasFormulario.length > 0 && (
                                    <div className="preguntas-agregadas">
                                        <h4>Preguntas Agregadas ({preguntasFormulario.length}):</h4>
                                        {preguntasFormulario.map((pregunta, index) => (
                                            <div key={pregunta.id_temporal} className="pregunta-item">
                                                <div className="pregunta-header">
                                                    <span className="pregunta-numero">{index + 1}.</span>
                                                    <span className="pregunta-tipo">[{pregunta.tipo_pregunta}]</span>
                                                    {pregunta.requerida && <span className="required-badge">Requerida</span>}
                                                </div>
                                                <div className="pregunta-texto">{pregunta.texto_pregunta}</div>
                                                {pregunta.opciones && pregunta.opciones.length > 0 && (
                                                    <div className="pregunta-opciones">
                                                        <strong>Opciones:</strong> {pregunta.opciones.map(op => op.texto_opcion).join(', ')}
                                                    </div>
                                                )}
                                                <button 
                                                    type="button"
                                                    onClick={() => eliminarPreguntaDelFormulario(pregunta.id_temporal)}
                                                    className="btn-danger btn-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Formulario para nueva pregunta */}
                                <div className="nueva-pregunta">
                                    <h4>Agregar Nueva Pregunta:</h4>
                                    
                                    <div className="campo">
                                        <label>Texto de la Pregunta *</label>
                                        <textarea
                                            name="texto_pregunta"
                                            value={nuevaPregunta.texto_pregunta}
                                            onChange={manejarCambioNuevaPregunta}
                                            placeholder="Escribe la pregunta..."
                                            rows="2"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label>Tipo de Pregunta</label>
                                        <select
                                            name="tipo_pregunta"
                                            value={nuevaPregunta.tipo_pregunta}
                                            onChange={manejarCambioNuevaPregunta}
                                        >
                                            <option value="text">Texto libre</option>
                                            <option value="textarea">Área de texto</option>
                                            <option value="number">Número</option>
                                            <option value="select">Selección única</option>
                                            <option value="multiple_choice">Opción múltiple</option>
                                            <option value="checkbox">Casilla de verificación</option>
                                        </select>
                                    </div>

                                    <div className="campo">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="requerida"
                                                checked={nuevaPregunta.requerida}
                                                onChange={manejarCambioNuevaPregunta}
                                            />
                                            Esta pregunta es requerida
                                        </label>
                                    </div>

                                    {/* Opciones para preguntas de selección */}
                                    {['select', 'multiple_choice'].includes(nuevaPregunta.tipo_pregunta) && (
                                        <div className="campo">
                                            <label>Opciones de Respuesta</label>
                                            <div className="opciones-input">
                                                <input
                                                    type="text"
                                                    value={nuevaOpcion}
                                                    onChange={(e) => setNuevaOpcion(e.target.value)}
                                                    placeholder="Nueva opción..."
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            agregarOpcionPregunta();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={agregarOpcionPregunta}
                                                    className="btn-secondary btn-sm"
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                            {nuevaPregunta.opciones.length > 0 && (
                                                <div className="opciones-lista">
                                                    {nuevaPregunta.opciones.map((opcion, index) => (
                                                        <div key={index} className="opcion-item">
                                                            <span>{opcion.texto_opcion}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => eliminarOpcionPregunta(index)}
                                                                className="btn-danger btn-sm"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={agregarPreguntaAlFormulario}
                                        className="btn-primary btn-sm"
                                        disabled={!nuevaPregunta.texto_pregunta.trim()}
                                    >
                                        + Agregar Pregunta
                                    </button>
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button type="button" onClick={cerrarModal} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {modoEdicion ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de gestión de preguntas */}
            {gestionPreguntasAbierto && cuestionarioPreguntasSeleccionado && (
                <GestionPreguntas
                    cuestionario={cuestionarioPreguntasSeleccionado}
                    onClose={() => {
                        setGestionPreguntasAbierto(false);
                        setCuestionarioPreguntasSeleccionado(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminCuestionarios;