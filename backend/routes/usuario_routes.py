from flask import Blueprint, request, jsonify
from backend.controllers.usuario_controller import authenticate_user

usuario_bp = Blueprint('usuario_bp', __name__)

@usuario_bp.route('/api/usuario/login', methods=['POST'])
def login():
    codigo_estudiante = request.json.get('codigo_estudiante')
    usuario = authenticate_user(codigo_estudiante)
    if usuario:
        return jsonify({'success': True, 'id_usuario': usuario.id_usuario, 'codigo_estudiante': usuario.codigo_estudiante}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404