from flask import request, jsonify
from app.models.models import db, RespuestaAutoeficacia, Usuario
from datetime import datetime

def obtener_todas_autoeficacias():
    try:
        respuestas = RespuestaAutoeficacia.query.all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas de autoeficacia',
            'error': str(e)
        }), 500

def crear_autoeficacia():
    try:
        data = request.get_json()
        
        # Validación
        if not data or 'id_usuario' not in data:
            return jsonify({
                'success': False,
                'message': 'Error de validación',
                'errors': [{'msg': 'El ID de usuario es requerido', 'field': 'id_usuario'}]
            }), 400
        
        # Verificar que el usuario existe
        usuario = Usuario.query.get(data['id_usuario'])
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        # Crear respuesta de autoeficacia
        nueva_respuesta = RespuestaAutoeficacia(
            id_usuario=data['id_usuario'],
            creditos_matriculados=data.get('creditos_matriculados'),
            creditos_ganadas=data.get('creditos_ganadas'),
            creditos_reprobadas=data.get('creditos_reprobadas'),
            puntos_calidad_pga=data.get('puntos_calidad_pga'),
            situacion=data.get('situacion'),
            estado=data.get('estado'),
            nro_materias_aprobadas=data.get('nro_materias_aprobadas'),
            nro_materias_reprobadas=data.get('nro_materias_reprobadas'),
            fecha_respuesta=datetime.now(),
            fecha_actualizacion=datetime.now()
        )
        
        db.session.add(nueva_respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nueva_respuesta.to_dict(),
            'message': 'Respuesta de autoeficacia creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear respuesta de autoeficacia',
            'error': str(e)
        }), 500

def obtener_autoeficacia_por_id(id_respuesta):
    try:
        respuesta = RespuestaAutoeficacia.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta de autoeficacia no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': respuesta.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuesta de autoeficacia',
            'error': str(e)
        }), 500

def obtener_autoeficacias_por_usuario(id_usuario):
    try:
        respuestas = RespuestaAutoeficacia.query.filter_by(id_usuario=id_usuario).all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas de autoeficacia del usuario',
            'error': str(e)
        }), 500

def eliminar_autoeficacia(id_respuesta):
    try:
        respuesta = RespuestaAutoeficacia.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta de autoeficacia no encontrada'
            }), 404
        
        db.session.delete(respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Respuesta de autoeficacia eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar respuesta de autoeficacia',
            'error': str(e)
        }), 500