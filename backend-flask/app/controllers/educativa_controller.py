from flask import request, jsonify
from app.models.models import db, RespuestaEducativa, Usuario
from datetime import datetime

def obtener_todas_educativas():
    try:
        respuestas = RespuestaEducativa.query.all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas educativas',
            'error': str(e)
        }), 500

def crear_educativa():
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
        
        # Crear respuesta educativa
        nueva_respuesta = RespuestaEducativa(
            id_usuario=data['id_usuario'],
            puntaje_educacion=data.get('puntaje_educacion'),
            nivel_educativo=data.get('nivel_educativo'),
            institucion=data.get('institucion'),
            fecha_respuesta=datetime.now()
        )
        
        db.session.add(nueva_respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nueva_respuesta.to_dict(),
            'message': 'Respuesta educativa creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear respuesta educativa',
            'error': str(e)
        }), 500

def obtener_educativa_por_id(id_respuesta):
    try:
        respuesta = RespuestaEducativa.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta educativa no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': respuesta.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuesta educativa',
            'error': str(e)
        }), 500

def obtener_educativas_por_usuario(id_usuario):
    try:
        respuestas = RespuestaEducativa.query.filter_by(id_usuario=id_usuario).all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas educativas del usuario',
            'error': str(e)
        }), 500

def eliminar_educativa(id_respuesta):
    try:
        respuesta = RespuestaEducativa.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta educativa no encontrada'
            }), 404
        
        db.session.delete(respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Respuesta educativa eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar respuesta educativa',
            'error': str(e)
        }), 500