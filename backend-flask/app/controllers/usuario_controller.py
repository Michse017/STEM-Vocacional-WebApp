from flask import request, jsonify
from app.models.models import db, Usuario
from sqlalchemy.exc import IntegrityError

def obtener_todos_usuarios():
    try:
        usuarios = Usuario.query.all()
        return jsonify({
            'success': True,
            'data': [usuario.to_dict() for usuario in usuarios],
            'count': len(usuarios)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener usuarios',
            'error': str(e)
        }), 500

def crear_usuario():
    try:
        data = request.get_json()
        
        # Validación
        if not data or 'codigo_estudiante' not in data:
            return jsonify({
                'success': False,
                'message': 'Error de validación',
                'errors': [{'msg': 'El código de estudiante es requerido', 'field': 'codigo_estudiante'}]
            }), 400
        
        codigo = data['codigo_estudiante'].strip()
        
        if not codigo or len(codigo) < 1 or len(codigo) > 15:
            return jsonify({
                'success': False,
                'message': 'Error de validación',
                'errors': [{'msg': 'El código debe tener entre 1 y 15 caracteres', 'field': 'codigo_estudiante'}]
            }), 400
        
        # Crear usuario (sin fecha_creacion)
        nuevo_usuario = Usuario(codigo_estudiante=codigo)
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nuevo_usuario.to_dict(),
            'message': 'Usuario creado exitosamente'
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'El código de estudiante ya existe'
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al crear usuario',
            'error': str(e)
        }), 500

def obtener_usuario_por_id(id_usuario):
    try:
        usuario = Usuario.query.get(id_usuario)
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': usuario.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener usuario',
            'error': str(e)
        }), 500

def obtener_usuario_por_codigo(codigo):
    try:
        usuario = Usuario.query.filter_by(codigo_estudiante=codigo).first()
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': usuario.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener usuario',
            'error': str(e)
        }), 500

def eliminar_usuario(id_usuario):
    try:
        usuario = Usuario.query.get(id_usuario)
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error al eliminar usuario',
            'error': str(e)
        }), 500