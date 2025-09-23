import React, { useState, useEffect } from 'react';
import './AdminCuestionarios.css';

const AdminCuestionarios = () => {
    const [cuestionarios, setCuestionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cuestionarioSeleccionado, setCuestionarioSeleccionado] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
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
            return 'http://localhost:5000';
        }
        // En producción, usar la URL completa del backend en Render
        return 'https://stem-backend-9sc0.onrender.com';
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
        if (cuestionario) {
            // Modo edición
            setModoEdicion(true);
            setCuestionarioSeleccionado(cuestionario);
            setFormulario({
                nombre: cuestionario.nombre,
                descripcion: cuestionario.descripcion || '',
                tipo: cuestionario.tipo || ''
            });
        } else {
            // Modo creación
            setModoEdicion(false);
            setCuestionarioSeleccionado(null);
            setFormulario({
                nombre: '',
                descripcion: '',
                tipo: ''
            });
        }
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setCuestionarioSeleccionado(null);
        setModoEdicion(false);
        setFormulario({
            nombre: '',
            descripcion: '',
            tipo: ''
        });
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
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formulario)
            });
            
            const data = await response.json();
            
            if (data.success) {
                cerrarModal();
                cargarCuestionarios(); // Recargar la lista
                const mensaje = data.mode === 'mock' 
                    ? `${modoEdicion ? 'Cuestionario actualizado' : 'Cuestionario creado'} (modo demostración)`
                    : `${modoEdicion ? 'Cuestionario actualizado' : 'Cuestionario creado'} exitosamente`;
                alert(mensaje);
            } else {
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

    const verDetalle = async (id) => {
        try {
            const baseUrl = getBaseUrl();
            const response = await fetch(`${baseUrl}/admin/cuestionarios/${id}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.data.preguntas && data.data.preguntas.length > 0) {
                    // Mostrar preguntas existentes
                    const preguntasTexto = data.data.preguntas
                        .map((p, i) => `${i + 1}. ${p.texto_pregunta}`)
                        .join('\n');
                    alert(`Preguntas en "${data.data.nombre}":\n\n${preguntasTexto}`);
                } else {
                    alert('Este cuestionario no tiene preguntas aún.\n\nLa funcionalidad para agregar preguntas estará disponible en la próxima actualización.');
                }
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al cargar el detalle del cuestionario');
        }
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
                                    onClick={() => verDetalle(cuestionario.id_cuestionario)}
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
        </div>
    );
};

export default AdminCuestionarios;