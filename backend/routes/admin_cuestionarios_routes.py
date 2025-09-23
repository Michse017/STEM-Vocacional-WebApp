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
        
        return jsonify({
            'success': True,
            'data': [{
                'id_cuestionario': c.id_cuestionario,
                'nombre': c.nombre,
                'descripcion': c.descripcion,
                'tipo': c.tipo,
                'activo': c.activo,
                'fecha_creacion': c.fecha_creacion.isoformat() if c.fecha_creacion else None,
                'fecha_actualizacion': c.fecha_actualizacion.isoformat() if c.fecha_actualizacion else None
            } for c in cuestionarios]
        })
    except Exception as e:
        logger.error(f"Error al listar cuestionarios: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al obtener cuestionarios'}), 500


@admin_cuestionarios_bp.route('/cuestionarios', methods=['POST'])
@handle_db_session
def crear_cuestionario(db_session):
    """Crea un nuevo cuestionario."""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data or not data.get('nombre'):
            return jsonify({'success': False, 'error': 'El nombre del cuestionario es requerido'}), 400
        
        service = CuestionarioService(db_session)
        cuestionario = service.crear_cuestionario(
            nombre=data['nombre'],
            descripcion=data.get('descripcion'),
            tipo=data.get('tipo')
        )
        
        return jsonify({
            'success': True,
            'data': {
                'id_cuestionario': cuestionario.id_cuestionario,
                'nombre': cuestionario.nombre,
                'descripcion': cuestionario.descripcion,
                'tipo': cuestionario.tipo,
                'activo': cuestionario.activo
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error al crear cuestionario: {str(e)}")
        return jsonify({'success': False, 'error': 'Error al crear cuestionario'}), 500


@admin_cuestionarios_bp.route('/cuestionarios/<int:id_cuestionario>', methods=['GET'])
@handle_db_session
def obtener_cuestionario(db_session, id_cuestionario):
    """Obtiene un cuestionario específico con sus preguntas."""
    try:
        cuestionario_service = CuestionarioService(db_session)
        pregunta_service = PreguntaService(db_session)
        
        cuestionario = cuestionario_service.obtener_cuestionario_por_id(id_cuestionario)
        
        if not cuestionario:
            return jsonify({'success': False, 'error': 'Cuestionario no encontrado'}), 404
        
        preguntas = pregunta_service.obtener_preguntas_cuestionario(id_cuestionario)
        
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