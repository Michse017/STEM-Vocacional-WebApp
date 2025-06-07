from flask import request, jsonify
from app.models.models import db, RespuestaEducativaFamiliar, Usuario
from datetime import datetime

def obtener_todas_educativas_familiares():
    try:
        respuestas = RespuestaEducativaFamiliar.query.all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas educativas familiares',
            'error': str(e)
        }), 500

def crear_educativa_familiar():
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
        
        # Convertir fecha de graduación si viene como string
        fecha_graduacion = None
        if data.get('fecha_graduacion'):
            try:
                fecha_graduacion = datetime.strptime(data['fecha_graduacion'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }), 400
        
        # Crear respuesta educativa familiar
        nueva_respuesta = RespuestaEducativaFamiliar(
            id_usuario=data['id_usuario'],
            colegio=data.get('colegio'),
            ciudad_colegio=data.get('ciudad_colegio'),
            depto_colegio=data.get('depto_colegio'),
            municipio_colegio=data.get('municipio_colegio'),
            fecha_graduacion=fecha_graduacion,
            fecha_respuesta=datetime.now(),
            fecha_actualizacion=datetime.now()
        )
        
        db.session.add(nueva_respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nueva_respuesta.to_dict(),
            'message': 'Respuesta educativa familiar creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear respuesta educativa familiar',
            'error': str(e)
        }), 500

def obtener_educativa_familiar_por_id(id_respuesta):
    try:
        respuesta = RespuestaEducativaFamiliar.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta educativa familiar no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': respuesta.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuesta educativa familiar',
            'error': str(e)
        }), 500

def obtener_educativas_familiares_por_usuario(id_usuario):
    try:
        respuestas = RespuestaEducativaFamiliar.query.filter_by(id_usuario=id_usuario).all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas educativas familiares del usuario',
            'error': str(e)
        }), 500

def eliminar_educativa_familiar(id_respuesta):
    try:
        respuesta = RespuestaEducativaFamiliar.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta educativa familiar no encontrada'
            }), 404
        
        db.session.delete(respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Respuesta educativa familiar eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar respuesta educativa familiar',
            'error': str(e)
        }), 500