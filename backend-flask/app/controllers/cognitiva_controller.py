from flask import request, jsonify
from app.models.models import db, RespuestaCognitiva, Usuario
from datetime import datetime

def obtener_todas_cognitivas():
    try:
        respuestas = RespuestaCognitiva.query.all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas cognitivas',
            'error': str(e)
        }), 500

def crear_cognitiva():
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
        
        # Crear respuesta cognitiva con todos los campos disponibles
        nueva_respuesta = RespuestaCognitiva(
            id_usuario=data['id_usuario'],
            ptj_fisica=data.get('ptj_fisica'),
            ptj_quimica=data.get('ptj_quimica'),
            ptj_biologia=data.get('ptj_biologia'),
            ptj_matematicas=data.get('ptj_matematicas'),
            ptj_geografia=data.get('ptj_geografia'),
            ptj_historia=data.get('ptj_historia'),
            ptj_filosofia=data.get('ptj_filosofia'),
            ptj_sociales_ciudadano=data.get('ptj_sociales_ciudadano'),
            ptj_ciencias_sociales=data.get('ptj_ciencias_sociales'),
            ptj_lenguaje=data.get('ptj_lenguaje'),
            ptj_lectura_critica=data.get('ptj_lectura_critica'),
            ptj_ingles=data.get('ptj_ingles'),
            ecaes=data.get('ecaes'),
            pga_acumulado=data.get('pga_acumulado'),
            promedio_periodo=data.get('promedio_periodo'),
            fecha_respuesta=datetime.now(),
            fecha_actualizacion=datetime.now()
        )
        
        db.session.add(nueva_respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nueva_respuesta.to_dict(),
            'message': 'Respuesta cognitiva creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear respuesta cognitiva',
            'error': str(e)
        }), 500

def obtener_cognitiva_por_id(id_respuesta):
    try:
        respuesta = RespuestaCognitiva.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta cognitiva no encontrada'
            }), 404
        
        return jsonify({
            'success': True,
            'data': respuesta.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuesta cognitiva',
            'error': str(e)
        }), 500

def obtener_cognitivas_por_usuario(id_usuario):
    try:
        respuestas = RespuestaCognitiva.query.filter_by(id_usuario=id_usuario).all()
        return jsonify({
            'success': True,
            'data': [respuesta.to_dict() for respuesta in respuestas],
            'count': len(respuestas)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener respuestas cognitivas del usuario',
            'error': str(e)
        }), 500

def eliminar_cognitiva(id_respuesta):
    try:
        respuesta = RespuestaCognitiva.query.get(id_respuesta)
        if not respuesta:
            return jsonify({
                'success': False,
                'message': 'Respuesta cognitiva no encontrada'
            }), 404
        
        db.session.delete(respuesta)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Respuesta cognitiva eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar respuesta cognitiva',
            'error': str(e)
        }), 500

def crear_o_actualizar_cognitiva():
    try:
        data = request.get_json()
        
        if not data or 'id_usuario' not in data:
            return jsonify({
                'success': False,
                'message': 'Error de validación',
                'errors': [{'msg': 'El ID de usuario es requerido', 'field': 'id_usuario'}]
            }), 400
        
        # Buscar si ya existe una respuesta para este usuario
        respuesta_existente = RespuestaCognitiva.query.filter_by(id_usuario=data['id_usuario']).first()
        
        if respuesta_existente:
            # ACTUALIZAR registro existente
            respuesta_existente.ptj_fisica = data.get('ptj_fisica', respuesta_existente.ptj_fisica)
            respuesta_existente.ptj_quimica = data.get('ptj_quimica', respuesta_existente.ptj_quimica)
            respuesta_existente.ptj_biologia = data.get('ptj_biologia', respuesta_existente.ptj_biologia)
            respuesta_existente.ptj_matematicas = data.get('ptj_matematicas', respuesta_existente.ptj_matematicas)
            respuesta_existente.ptj_geografia = data.get('ptj_geografia', respuesta_existente.ptj_geografia)
            respuesta_existente.ptj_historia = data.get('ptj_historia', respuesta_existente.ptj_historia)
            respuesta_existente.ptj_filosofia = data.get('ptj_filosofia', respuesta_existente.ptj_filosofia)
            respuesta_existente.ptj_sociales_ciudadano = data.get('ptj_sociales_ciudadano', respuesta_existente.ptj_sociales_ciudadano)
            respuesta_existente.ptj_ciencias_sociales = data.get('ptj_ciencias_sociales', respuesta_existente.ptj_ciencias_sociales)
            respuesta_existente.ptj_lenguaje = data.get('ptj_lenguaje', respuesta_existente.ptj_lenguaje)
            respuesta_existente.ptj_lectura_critica = data.get('ptj_lectura_critica', respuesta_existente.ptj_lectura_critica)
            respuesta_existente.ptj_ingles = data.get('ptj_ingles', respuesta_existente.ptj_ingles)
            respuesta_existente.ecaes = data.get('ecaes', respuesta_existente.ecaes)
            respuesta_existente.pga_acumulado = data.get('pga_acumulado', respuesta_existente.pga_acumulado)
            respuesta_existente.promedio_periodo = data.get('promedio_periodo', respuesta_existente.promedio_periodo)
            respuesta_existente.fecha_actualizacion = datetime.now()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'data': respuesta_existente.to_dict(),
                'message': 'Respuesta cognitiva actualizada exitosamente'
            }), 200
        else:
            # CREAR nuevo registro
            return crear_cognitiva()
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear o actualizar respuesta cognitiva',
            'error': str(e)
        }), 500