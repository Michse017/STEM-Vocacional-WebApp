from flask import request, jsonify
from app.models.models import db, RespuestaSocioeconomica, Usuario
from datetime import datetime

def obtener_todas_socioeconomicas():
    try:
        respuestas = RespuestaSocioeconomica.query.all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas socioeconómicas',
            'error': str(e)
        }), 500

def crear_socioeconomica():
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
        
        # Crear respuesta socioeconómica
        nueva_respuesta = RespuestaSocioeconomica(
            id_usuario=data['id_usuario'],
            estrato=data.get('estrato'),
            becas=data.get('becas'),
            ceres=data.get('ceres'),
            periodo_ingreso=data.get('periodo_ingreso'),
            tipo_estudiante=data.get('tipo_estudiante'),
            fecha_respuesta=datetime.now(),
            fecha_actualizacion=datetime.now()
        )
        
        db.session.add(nueva_respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nueva_respuesta.to_dict(),
            'message': 'Respuesta socioeconómica creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear respuesta socioeconómica',
            'error': str(e)
        }), 500

def obtener_socioeconomica_por_id(id_respuesta):
    try:
        respuesta = RespuestaSocioeconomica.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta socioeconómica no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': respuesta.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuesta socioeconómica',
            'error': str(e)
        }), 500

def obtener_socioeconomicas_por_usuario(id_usuario):
    try:
        respuestas = RespuestaSocioeconomica.query.filter_by(id_usuario=id_usuario).all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas socioeconómicas del usuario',
            'error': str(e)
        }), 500

def eliminar_socioeconomica(id_respuesta):
    try:
        respuesta = RespuestaSocioeconomica.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta socioeconómica no encontrada'
            }), 404
        
        db.session.delete(respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Respuesta socioeconómica eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar respuesta socioeconómica',
            'error': str(e)
        }), 500