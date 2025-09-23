"""
Rutas API para la administración de cuestionarios dinámicos.
Incluye endpoints para CRUD de cuestionarios, preguntas y opciones.
"""

import os
import sys
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import sessionmaker
from functools import wraps
import logging

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.controller import engine
from database.models import Cuestionario, Pregunta, OpcionPregunta
from backend.services.cuestionario_service import CuestionarioService, PreguntaService, RespuestaService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear blueprint
admin_cuestionarios_bp = Blueprint('admin_cuestionarios', __name__)

# Crear sesión de base de datos
Session = sessionmaker(bind=engine)

def get_db_session():
    """Obtiene una sesión de base de datos."""
    return Session()

def handle_db_session(f):
    """Decorador para manejar sesiones de base de datos."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        db_session = get_db_session()
        try:
            return f(db_session, *args, **kwargs)
        except Exception as e:
            db_session.rollback()
            logger.error(f"Error en {f.__name__}: {str(e)}")
            return jsonify({'error': 'Error interno del servidor'}), 500
        finally:
            db_session.close()
    return decorated_function


# ============================================================================
# ENDPOINTS PARA CUESTIONARIOS
# ============================================================================

@admin_cuestionarios_bp.route('/cuestionarios', methods=['GET'])
@handle_db_session
def listar_cuestionarios(db_session):
    """Lista todos los cuestionarios."""
    try:
        service = CuestionarioService(db_session)
        cuestionarios = service.obtener_cuestionarios_activos()
        
        # También obtener el servicio de preguntas para contar preguntas
        pregunta_service = PreguntaService(db_session)
        
        return jsonify({
            'success': True,
            'data': [{
                'id_cuestionario': c.id_cuestionario,
                'nombre': c.nombre,
                'descripcion': c.descripcion,
                'tipo': c.tipo,
                'activo': c.activo,
                'fecha_creacion': c.fecha_creacion.isoformat() if c.fecha_creacion else None,
                'fecha_actualizacion': c.fecha_actualizacion.isoformat() if c.fecha_actualizacion else None,
                'num_preguntas': len(pregunta_service.obtener_preguntas_cuestionario(c.id_cuestionario))
            } for c in cuestionarios]
        })
    except Exception as e:
        logger.error(f"Error al listar cuestionarios: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al obtener cuestionarios'}), 500


@admin_cuestionarios_bp.route('/cuestionarios', methods=['POST'])
@handle_db_session
def crear_cuestionario(db_session):
    """Crea un nuevo cuestionario con preguntas opcionales."""
    try:
        data = request.get_json()
        logger.info(f"=== DEBUG BACKEND ===")
        logger.info(f"Datos completos recibidos: {data}")
        logger.info(f"Tipo de datos: {type(data)}")
        
        # Validar datos requeridos
        if not data or not data.get('nombre'):
            logger.error("Error: Nombre del cuestionario faltante")
            return jsonify({'success': False, 'error': 'El nombre del cuestionario es requerido'}), 400
        
        # DEBUG: Verificar preguntas recibidas
        preguntas_data = data.get('preguntas', [])
        logger.info(f"Preguntas en payload: {preguntas_data}")
        logger.info(f"Número de preguntas recibidas: {len(preguntas_data)}")
        logger.info(f"Tipo de preguntas: {type(preguntas_data)}")
        
        if preguntas_data:
            for i, pregunta in enumerate(preguntas_data):
                logger.info(f"Pregunta {i+1} recibida: {pregunta}")
                logger.info(f"Tipo pregunta {i+1}: {type(pregunta)}")
        else:
            logger.warning("No se recibieron preguntas en el payload")
        
        # Crear cuestionario
        logger.info("Iniciando creación del cuestionario...")
        cuestionario_service = CuestionarioService(db_session)
        cuestionario = cuestionario_service.crear_cuestionario(
            nombre=data['nombre'],
            descripcion=data.get('descripcion'),
            tipo=data.get('tipo'),
            auto_commit=False  # No hacer commit hasta el final
        )
        logger.info(f"Cuestionario creado con ID: {cuestionario.id_cuestionario}")
        
        # Crear preguntas si las hay
        preguntas_creadas = []
        logger.info(f"Procesando {len(preguntas_data)} preguntas")
        
        if preguntas_data:
            logger.info("Entrando al bloque de procesamiento de preguntas...")
            pregunta_service = PreguntaService(db_session)
            
            for i, pregunta_data in enumerate(preguntas_data):
                try:
                    logger.info(f"=== PROCESANDO PREGUNTA {i+1} ===")
                    logger.info(f"Datos pregunta {i+1}: {pregunta_data}")
                    logger.info(f"Tipo datos pregunta: {type(pregunta_data)}")
                    
                    # Verificar campos requeridos
                    texto_pregunta = pregunta_data.get('texto_pregunta')
                    tipo_pregunta = pregunta_data.get('tipo_pregunta')
                    
                    logger.info(f"texto_pregunta: '{texto_pregunta}'")
                    logger.info(f"tipo_pregunta: '{tipo_pregunta}'")
                    
                    if not texto_pregunta:
                        logger.error(f"ERROR: texto_pregunta vacío en pregunta {i+1}")
                        raise ValueError(f"texto_pregunta es requerido para pregunta {i+1}")
                    
                    if not tipo_pregunta:
                        logger.error(f"ERROR: tipo_pregunta vacío en pregunta {i+1}")
                        raise ValueError(f"tipo_pregunta es requerido para pregunta {i+1}")
                    
                    logger.info(f"Llamando a crear_pregunta para pregunta {i+1}...")
                    pregunta = pregunta_service.crear_pregunta(
                        id_cuestionario=cuestionario.id_cuestionario,
                        texto=texto_pregunta,
                        tipo_pregunta=tipo_pregunta,
                        requerida=pregunta_data.get('requerida', True),
                        orden=pregunta_data.get('orden', i + 1),
                        auto_commit=False  # No hacer commit hasta el final
                    )
                    logger.info(f"Pregunta {i+1} creada exitosamente con ID: {pregunta.id_pregunta}")
                    
                    # Crear opciones si las hay
                    opciones_creadas = []
                    opciones_data = pregunta_data.get('opciones', [])
                    logger.info(f"Procesando {len(opciones_data)} opciones para pregunta {pregunta.id_pregunta}")
                    
                    for j, opcion_data in enumerate(opciones_data):
                        try:
                            logger.info(f"Creando opción {j+1} para pregunta {pregunta.id_pregunta}: {opcion_data}")
                            opcion = pregunta_service.crear_opcion_pregunta(
                                id_pregunta=pregunta.id_pregunta,
                                texto=opcion_data['texto_opcion'],
                                valor=opcion_data.get('valor'),
                                orden=opcion_data.get('orden', j + 1),
                                auto_commit=False  # No hacer commit hasta el final
                            )
                            opciones_creadas.append({
                                'id_opcion': opcion.id_opcion,
                                'texto_opcion': opcion.texto,
                                'valor': opcion.valor
                            })
                            logger.info(f"Opción {j+1} creada con ID: {opcion.id_opcion}")
                        except Exception as opcion_error:
                            logger.error(f"ERROR al crear opción {j+1} para pregunta {pregunta.id_pregunta}: {str(opcion_error)}")
                            import traceback
                            logger.error(f"Traceback opción: {traceback.format_exc()}")
                            raise opcion_error
                    
                    preguntas_creadas.append({
                        'id_pregunta': pregunta.id_pregunta,
                        'texto_pregunta': pregunta.texto,
                        'tipo_pregunta': pregunta.tipo_pregunta,
                        'requerida': pregunta.requerida,
                        'orden': pregunta.orden,
                        'opciones': opciones_creadas
                    })
                    logger.info(f"Pregunta {i+1} completamente procesada")
                    
                except Exception as pregunta_error:
                    logger.error(f"ERROR CRÍTICO al procesar pregunta {i+1}: {str(pregunta_error)}")
                    import traceback
                    logger.error(f"Traceback pregunta {i+1}: {traceback.format_exc()}")
                    raise pregunta_error
            
            # Hacer commit de todas las preguntas y opciones de una vez
            try:
                logger.info(f"Intentando hacer commit de {len(preguntas_creadas)} preguntas...")
                db_session.commit()
                logger.info(f"COMMIT EXITOSO de cuestionario y {len(preguntas_creadas)} preguntas")
            except Exception as commit_error:
                logger.error(f"ERROR CRÍTICO EN COMMIT: {str(commit_error)}")
                import traceback
                logger.error(f"Traceback commit: {traceback.format_exc()}")
                logger.info("Haciendo rollback...")
                db_session.rollback()
                raise commit_error
        else:
            # Si no hay preguntas, hacer commit solo del cuestionario
            try:
                logger.info("No hay preguntas, haciendo commit solo del cuestionario...")
                db_session.commit()
                logger.info("Commit exitoso del cuestionario sin preguntas")
            except Exception as commit_error:
                logger.error(f"ERROR en commit de cuestionario sin preguntas: {str(commit_error)}")
                import traceback
                logger.error(f"Traceback commit cuestionario: {traceback.format_exc()}")
                db_session.rollback()
                raise commit_error
        
        logger.info(f"Cuestionario completado con {len(preguntas_creadas)} preguntas creadas")
        
        response_data = {
            'success': True,
            'data': {
                'id_cuestionario': cuestionario.id_cuestionario,
                'nombre': cuestionario.nombre,
                'descripcion': cuestionario.descripcion,
                'tipo': cuestionario.tipo,
                'total_preguntas': len(preguntas_creadas),
                'preguntas': preguntas_creadas
            }
        }
        
        logger.info(f"Enviando respuesta final: {response_data}")
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"Error al crear cuestionario: {str(e)}")
        logger.error(f"Datos recibidos: {data if 'data' in locals() else 'No disponible'}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': f'Error al crear cuestionario: {str(e)}'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>', methods=['GET'])
@handle_db_session
def obtener_cuestionario(db_session, id_cuestionario):
    """Obtiene un cuestionario específico con sus preguntas."""
    try:
        logger.info(f"Consultando cuestionario ID: {id_cuestionario}")
        cuestionario_service = CuestionarioService(db_session)
        pregunta_service = PreguntaService(db_session)
        
        cuestionario = cuestionario_service.obtener_cuestionario_por_id(id_cuestionario)
        
        if not cuestionario:
            logger.warning(f"Cuestionario {id_cuestionario} no encontrado")
            return jsonify({'success': False, 'error': 'Cuestionario no encontrado'}), 404
        
        preguntas = pregunta_service.obtener_preguntas_cuestionario(id_cuestionario)
        logger.info(f"Encontradas {len(preguntas)} preguntas para cuestionario {id_cuestionario}")
        
        for i, p in enumerate(preguntas):
            logger.info(f"Pregunta {i+1}: ID={p.id_pregunta}, Texto='{p.texto[:50]}...', Tipo={p.tipo_pregunta}")
        
        return jsonify({
            'success': True,
            'data': {
                'id_cuestionario': cuestionario.id_cuestionario,
                'nombre': cuestionario.nombre,
                'descripcion': cuestionario.descripcion,
                'tipo': cuestionario.tipo,
                'activo': cuestionario.activo,
                'preguntas': [{
                    'id_pregunta': p.id_pregunta,
                    'texto': p.texto,
                    'tipo_pregunta': p.tipo_pregunta,
                    'requerida': p.requerida,
                    'orden': p.orden,
                    'min_valor': p.min_valor,
                    'max_valor': p.max_valor,
                    'ayuda_texto': p.ayuda_texto,
                    'opciones': [{
                        'id_opcion': o.id_opcion,
                        'texto': o.texto,
                        'valor': o.valor,
                        'orden': o.orden
                    } for o in p.opciones]
                } for p in preguntas]
            }
        })
        
    except Exception as e:
        logger.error(f"Error al obtener cuestionario: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Error al obtener cuestionario'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>', methods=['PUT'])
@handle_db_session
def actualizar_cuestionario(db_session, id_cuestionario):
    """Actualiza un cuestionario."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        
        service = CuestionarioService(db_session)
        cuestionario = service.actualizar_cuestionario(id_cuestionario, **data)
        
        if not cuestionario:
            return jsonify({'success': False, 'error': 'Cuestionario no encontrado'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id_cuestionario': cuestionario.id_cuestionario,
                'nombre': cuestionario.nombre,
                'descripcion': cuestionario.descripcion,
                'tipo': cuestionario.tipo,
                'activo': cuestionario.activo
            }
        })
        
    except Exception as e:
        logger.error(f"Error al actualizar cuestionario: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al actualizar cuestionario'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>', methods=['DELETE'])
@handle_db_session
def eliminar_cuestionario(db_session, id_cuestionario):
    """Elimina (desactiva) un cuestionario."""
    try:
        service = CuestionarioService(db_session)
        success = service.eliminar_cuestionario(id_cuestionario)
        
        if not success:
            return jsonify({'success': False, 'error': 'Cuestionario no encontrado'}), 404
        
        return jsonify({'success': True, 'message': 'Cuestionario eliminado correctamente'})
        
    except Exception as e:
        logger.error(f"Error al eliminar cuestionario: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al eliminar cuestionario'}), 500


# ============================================================================
# ENDPOINTS PARA PREGUNTAS
# ============================================================================

@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>/preguntas', methods=['POST'])
@handle_db_session
def crear_pregunta(db_session, id_cuestionario):
    """Crea una nueva pregunta en un cuestionario."""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data or not data.get('texto_pregunta') or not data.get('tipo_pregunta'):
            return jsonify({'success': False, 'error': 'Texto y tipo de pregunta son requeridos'}), 400
        
        service = PreguntaService(db_session)
        pregunta = service.crear_pregunta(
            id_cuestionario=id_cuestionario,
            texto=data['texto_pregunta'],
            tipo_pregunta=data['tipo_pregunta'],
            requerida=data.get('requerida', True),
            orden=data.get('orden'),
            min_valor=data.get('min_valor'),
            max_valor=data.get('max_valor'),
            patron_validacion=data.get('patron_validacion'),
            ayuda_texto=data.get('ayuda_texto')
        )
        
        # Crear opciones si las hay
        opciones = data.get('opciones', [])
        for opcion_data in opciones:
            service.crear_opcion_pregunta(
                id_pregunta=pregunta.id_pregunta,
                texto=opcion_data['texto_opcion'],
                valor=opcion_data.get('valor'),
                orden=opcion_data.get('orden')
            )
        
        return jsonify({
            'success': True,
            'data': {
                'id_pregunta': pregunta.id_pregunta,
                'texto_pregunta': pregunta.texto,
                'tipo_pregunta': pregunta.tipo_pregunta,
                'requerida': pregunta.requerida,
                'orden': pregunta.orden
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error al crear pregunta: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al crear pregunta'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>/preguntas/<int:id_pregunta>', methods=['PUT'])
@handle_db_session
def actualizar_pregunta(db_session, id_cuestionario, id_pregunta):
    """Actualiza una pregunta existente."""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data:
            return jsonify({'success': False, 'error': 'No se proporcionaron datos'}), 400
        
        service = PreguntaService(db_session)
        
        # Verificar que la pregunta existe
        pregunta = service.obtener_pregunta(id_pregunta)
        if not pregunta or pregunta.id_cuestionario != id_cuestionario:
            return jsonify({'success': False, 'error': 'Pregunta no encontrada'}), 404
        
        # Actualizar pregunta
        pregunta_actualizada = service.actualizar_pregunta(
            id_pregunta=id_pregunta,
            texto=data.get('texto_pregunta', pregunta.texto),
            tipo_pregunta=data.get('tipo_pregunta', pregunta.tipo_pregunta),
            requerida=data.get('requerida', pregunta.requerida),
            orden=data.get('orden', pregunta.orden),
            min_valor=data.get('min_valor', pregunta.min_valor),
            max_valor=data.get('max_valor', pregunta.max_valor),
            patron_validacion=data.get('patron_validacion', pregunta.patron_validacion),
            ayuda_texto=data.get('ayuda_texto', pregunta.ayuda_texto)
        )
        
        # Actualizar opciones si las hay
        opciones = data.get('opciones', [])
        if opciones is not None:
            # Primero eliminar opciones existentes
            service.eliminar_opciones_pregunta(id_pregunta)
            
            # Crear nuevas opciones
            for opcion_data in opciones:
                if isinstance(opcion_data, dict) and 'texto_opcion' in opcion_data:
                    service.crear_opcion_pregunta(
                        id_pregunta=id_pregunta,
                        texto=opcion_data['texto_opcion'],
                        valor=opcion_data.get('valor'),
                        orden=opcion_data.get('orden')
                    )
        
        # Obtener opciones actualizadas
        opciones_actualizadas = service.obtener_opciones_pregunta(id_pregunta)
        
        return jsonify({
            'success': True,
            'data': {
                'id_pregunta': pregunta_actualizada.id_pregunta,
                'texto_pregunta': pregunta_actualizada.texto,
                'tipo_pregunta': pregunta_actualizada.tipo_pregunta,
                'requerida': pregunta_actualizada.requerida,
                'orden': pregunta_actualizada.orden,
                'opciones': [{
                    'id_opcion': op.id_opcion,
                    'texto_opcion': op.texto,
                    'valor': op.valor
                } for op in opciones_actualizadas]
            }
        })
        
    except Exception as e:
        logger.error(f"Error al actualizar pregunta: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al actualizar pregunta'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>/preguntas/<int:id_pregunta>', methods=['DELETE'])
@handle_db_session
def eliminar_pregunta(db_session, id_cuestionario, id_pregunta):
    """Elimina una pregunta existente."""
    try:
        service = PreguntaService(db_session)
        
        # Verificar que la pregunta existe
        pregunta = service.obtener_pregunta(id_pregunta)
        if not pregunta or pregunta.id_cuestionario != id_cuestionario:
            return jsonify({'success': False, 'error': 'Pregunta no encontrada'}), 404
        
        # Eliminar la pregunta (esto también eliminará las opciones por CASCADE)
        success = service.eliminar_pregunta(id_pregunta)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Pregunta eliminada correctamente'
            })
        else:
            return jsonify({'success': False, 'error': 'No se pudo eliminar la pregunta'}), 500
        
    except Exception as e:
        logger.error(f"Error al eliminar pregunta: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al eliminar pregunta'}), 500


# ============================================================================
# ENDPOINTS PARA RESPUESTAS (Para estudiantes)
# ============================================================================

@admin_cuestionarios_bp.route('/respuestas/iniciar', methods=['POST'])
@handle_db_session
def iniciar_cuestionario_usuario(db_session):
    """Inicia un cuestionario para un usuario."""
    try:
        data = request.get_json()
        
        if not data or not data.get('id_usuario') or not data.get('id_cuestionario'):
            return jsonify({'success': False, 'error': 'ID de usuario y cuestionario requeridos'}), 400
        
        service = RespuestaService(db_session)
        respuesta = service.iniciar_cuestionario(
            id_usuario=data['id_usuario'],
            id_cuestionario=data['id_cuestionario']
        )
        
        return jsonify({
            'success': True,
            'data': {
                'id_respuesta_cuestionario': respuesta.id_respuesta_cuestionario,
                'id_usuario': respuesta.id_usuario,
                'id_cuestionario': respuesta.id_cuestionario,
                'completado': respuesta.completado,
                'fecha_inicio': respuesta.fecha_inicio.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error al iniciar cuestionario: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al iniciar cuestionario'}), 500


@admin_cuestionarios_bp.route('/respuestas/guardar', methods=['POST'])
@handle_db_session
def guardar_respuesta_pregunta(db_session):
    """Guarda la respuesta a una pregunta específica."""
    try:
        data = request.get_json()
        
        campos_requeridos = ['id_respuesta_cuestionario', 'id_pregunta', 'valor']
        if not data or not all(campo in data for campo in campos_requeridos):
            return jsonify({'success': False, 'error': 'Campos requeridos faltantes'}), 400
        
        service = RespuestaService(db_session)
        respuesta = service.guardar_respuesta(
            id_respuesta_cuestionario=data['id_respuesta_cuestionario'],
            id_pregunta=data['id_pregunta'],
            valor=data['valor']
        )
        
        return jsonify({
            'success': True,
            'data': {
                'id_respuesta': respuesta.id_respuesta,
                'valor_respuesta': respuesta.valor_respuesta,
                'fecha_respuesta': respuesta.fecha_respuesta.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error al guardar respuesta: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al guardar respuesta'}), 500


@admin_cuestionarios_bp.route('/respuestas/<int:id_respuesta_cuestionario>/completar', methods=['POST'])
@handle_db_session
def completar_cuestionario_usuario(db_session, id_respuesta_cuestionario):
    """Marca un cuestionario como completado."""
    try:
        service = RespuestaService(db_session)
        success = service.completar_cuestionario(id_respuesta_cuestionario)
        
        if not success:
            return jsonify({'success': False, 'error': 'Respuesta de cuestionario no encontrada'}), 404
        
        return jsonify({'success': True, 'message': 'Cuestionario completado correctamente'})
        
    except Exception as e:
        logger.error(f"Error al completar cuestionario: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al completar cuestionario'}), 500