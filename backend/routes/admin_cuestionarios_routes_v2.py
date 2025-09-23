"""
Rutas API para la administración de cuestionarios dinámicos - Versión de producción.
Incluye endpoints para CRUD de cuestionarios, preguntas y opciones.
"""

import os
import sys
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import sessionmaker
from functools import wraps
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Agregar el directorio raíz al path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(root_dir)

try:
    from database.controller import engine
    from database.models import Cuestionario, Pregunta, OpcionPregunta
    DB_AVAILABLE = True
    print("✅ Conexión a base de datos disponible")
except ImportError as e:
    print(f"⚠️  Base de datos no disponible: {e}")
    DB_AVAILABLE = False

# Crear blueprint
admin_cuestionarios_bp = Blueprint('admin_cuestionarios', __name__)

# Crear sesión de base de datos
if DB_AVAILABLE:
    Session = sessionmaker(bind=engine)

def handle_errors(f):
    """Decorador para manejo de errores"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error en {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {str(e)}'
            }), 500
    return decorated_function

# Datos mock para cuando la BD no esté disponible
cuestionarios_mock = [
    {
        'id_cuestionario': 1,
        'nombre': 'Cuestionario Sociodemográfico',
        'descripcion': 'Evaluación de características demográficas y socioeconómicas',
        'tipo': 'sociodemografico',
        'activo': True,
        'fecha_creacion': '2024-01-15T10:30:00',
        'num_preguntas': 12
    },
    {
        'id_cuestionario': 2,
        'nombre': 'Test de Inteligencias Múltiples',
        'descripcion': 'Evaluación basada en la teoría de Howard Gardner',
        'tipo': 'inteligencias_multiples',
        'activo': True,
        'fecha_creacion': '2024-01-16T14:20:00',
        'num_preguntas': 40
    },
    {
        'id_cuestionario': 3,
        'nombre': 'Evaluación Vocacional STEM',
        'descripcion': 'Cuestionario para identificar preferencias vocacionales en STEM',
        'tipo': 'vocacional',
        'activo': True,
        'fecha_creacion': '2024-01-17T09:15:00',
        'num_preguntas': 25
    }
]

@admin_cuestionarios_bp.route('/cuestionarios', methods=['GET'])
@handle_errors
def get_cuestionarios():
    """Obtener lista de cuestionarios"""
    if not DB_AVAILABLE:
        return jsonify({
            'success': True,
            'data': cuestionarios_mock,
            'count': len(cuestionarios_mock),
            'mode': 'mock'
        })
    
    session = Session()
    try:
        cuestionarios = session.query(Cuestionario).all()
        
        result = []
        for c in cuestionarios:
            # Contar preguntas
            num_preguntas = session.query(Pregunta).filter(Pregunta.id_cuestionario == c.id_cuestionario).count()
            
            result.append({
                'id_cuestionario': c.id_cuestionario,
                'nombre': c.nombre,
                'descripcion': c.descripcion,
                'tipo': c.tipo,
                'activo': c.activo,
                'fecha_creacion': c.fecha_creacion.isoformat() if c.fecha_creacion else None,
                'num_preguntas': num_preguntas
            })
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result),
            'mode': 'database'
        })
        
    finally:
        session.close()

@admin_cuestionarios_bp.route('/cuestionarios', methods=['POST'])
@handle_errors
def create_cuestionario():
    """Crear nuevo cuestionario"""
    data = request.get_json()
    
    if not data or not data.get('nombre'):
        return jsonify({
            'success': False,
            'error': 'El nombre del cuestionario es requerido'
        }), 400
    
    if not DB_AVAILABLE:
        # Modo mock
        nuevo_id = max([c['id_cuestionario'] for c in cuestionarios_mock]) + 1
        nuevo_cuestionario = {
            'id_cuestionario': nuevo_id,
            'nombre': data['nombre'],
            'descripcion': data.get('descripcion', ''),
            'tipo': data.get('tipo', ''),
            'activo': True,
            'fecha_creacion': '2024-01-20T12:00:00',
            'num_preguntas': 0
        }
        cuestionarios_mock.append(nuevo_cuestionario)
        
        return jsonify({
            'success': True,
            'data': nuevo_cuestionario,
            'message': 'Cuestionario creado exitosamente (modo mock)',
            'mode': 'mock'
        })
    
    session = Session()
    try:
        nuevo_cuestionario = Cuestionario(
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            tipo=data.get('tipo', ''),
            activo=True
        )
        
        session.add(nuevo_cuestionario)
        session.commit()
        
        # Refrescar para obtener el ID
        session.refresh(nuevo_cuestionario)
        
        result = {
            'id_cuestionario': nuevo_cuestionario.id_cuestionario,
            'nombre': nuevo_cuestionario.nombre,
            'descripcion': nuevo_cuestionario.descripcion,
            'tipo': nuevo_cuestionario.tipo,
            'activo': nuevo_cuestionario.activo,
            'fecha_creacion': nuevo_cuestionario.fecha_creacion.isoformat(),
            'num_preguntas': 0
        }
        
        return jsonify({
            'success': True,
            'data': result,
            'message': 'Cuestionario creado exitosamente',
            'mode': 'database'
        })
        
    finally:
        session.close()

@admin_cuestionarios_bp.route('/cuestionarios/<int:cuestionario_id>', methods=['GET'])
@handle_errors
def get_cuestionario(cuestionario_id):
    """Obtener cuestionario específico"""
    if not DB_AVAILABLE:
        cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        return jsonify({
            'success': True,
            'data': cuestionario,
            'mode': 'mock'
        })
    
    session = Session()
    try:
        cuestionario = session.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
        
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        
        # Obtener preguntas
        preguntas = session.query(Pregunta).filter(Pregunta.id_cuestionario == cuestionario_id).all()
        
        result = {
            'id_cuestionario': cuestionario.id_cuestionario,
            'nombre': cuestionario.nombre,
            'descripcion': cuestionario.descripcion,
            'tipo': cuestionario.tipo,
            'activo': cuestionario.activo,
            'fecha_creacion': cuestionario.fecha_creacion.isoformat() if cuestionario.fecha_creacion else None,
            'preguntas': [{
                'id_pregunta': p.id_pregunta,
                'texto_pregunta': p.texto_pregunta,
                'tipo_pregunta': p.tipo_pregunta,
                'orden': p.orden,
                'requerida': p.requerida
            } for p in preguntas]
        }
        
        return jsonify({
            'success': True,
            'data': result,
            'mode': 'database'
        })
        
    finally:
        session.close()

@admin_cuestionarios_bp.route('/cuestionarios/<int:cuestionario_id>', methods=['PUT'])
@handle_errors
def update_cuestionario(cuestionario_id):
    """Actualizar cuestionario"""
    data = request.get_json()
    
    if not DB_AVAILABLE:
        cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        
        if 'nombre' in data:
            cuestionario['nombre'] = data['nombre']
        if 'descripcion' in data:
            cuestionario['descripcion'] = data['descripcion']
        if 'tipo' in data:
            cuestionario['tipo'] = data['tipo']
        
        return jsonify({
            'success': True,
            'data': cuestionario,
            'message': 'Cuestionario actualizado exitosamente (modo mock)',
            'mode': 'mock'
        })
    
    session = Session()
    try:
        cuestionario = session.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
        
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        
        if 'nombre' in data:
            cuestionario.nombre = data['nombre']
        if 'descripcion' in data:
            cuestionario.descripcion = data['descripcion']
        if 'tipo' in data:
            cuestionario.tipo = data['tipo']
        if 'activo' in data:
            cuestionario.activo = data['activo']
        
        session.commit()
        
        result = {
            'id_cuestionario': cuestionario.id_cuestionario,
            'nombre': cuestionario.nombre,
            'descripcion': cuestionario.descripcion,
            'tipo': cuestionario.tipo,
            'activo': cuestionario.activo,
            'fecha_creacion': cuestionario.fecha_creacion.isoformat() if cuestionario.fecha_creacion else None
        }
        
        return jsonify({
            'success': True,
            'data': result,
            'message': 'Cuestionario actualizado exitosamente',
            'mode': 'database'
        })
        
    finally:
        session.close()

@admin_cuestionarios_bp.route('/cuestionarios/<int:cuestionario_id>', methods=['DELETE'])
@handle_errors
def delete_cuestionario(cuestionario_id):
    """Eliminar cuestionario"""
    if not DB_AVAILABLE:
        global cuestionarios_mock
        cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        
        cuestionarios_mock = [c for c in cuestionarios_mock if c['id_cuestionario'] != cuestionario_id]
        return jsonify({
            'success': True,
            'message': 'Cuestionario eliminado exitosamente (modo mock)',
            'mode': 'mock'
        })
    
    session = Session()
    try:
        cuestionario = session.query(Cuestionario).filter(Cuestionario.id_cuestionario == cuestionario_id).first()
        
        if not cuestionario:
            return jsonify({
                'success': False,
                'error': 'Cuestionario no encontrado'
            }), 404
        
        session.delete(cuestionario)
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cuestionario eliminado exitosamente',
            'mode': 'database'
        })
        
    finally:
        session.close()

@admin_cuestionarios_bp.route('/health', methods=['GET'])
def admin_health():
    """Endpoint de salud para administración"""
    return jsonify({
        'status': 'healthy',
        'service': 'admin-cuestionarios',
        'database_available': DB_AVAILABLE,
        'version': '2.0.0'
    })