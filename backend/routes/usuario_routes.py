from flask import Blueprint, request, jsonify
from backend.controllers.usuario_controller import authenticate_user

usuario_bp = Blueprint('usuario_bp', __name__)

@usuario_bp.route('/api/usuario/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Formato JSON requerido'}), 400
    codigo_estudiante = request.json.get('codigo_estudiante')
    if not codigo_estudiante:
        return jsonify({'success': False, 'message': 'Código requerido'}), 400
    usuario = authenticate_user(codigo_estudiante)
    if usuario:
        return jsonify({'success': True, 'id_usuario': usuario.id_usuario, 'codigo_estudiante': usuario.codigo_estudiante}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404