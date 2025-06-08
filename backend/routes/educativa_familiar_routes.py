from flask import Blueprint, request, jsonify
from backend.controllers.educativa_familiar_controller import save_educativa_familiar

educativa_familiar_bp = Blueprint('educativa_familiar_bp', __name__)

@educativa_familiar_bp.route('/api/educativa_familiar', methods=['POST'])
def save():
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if save_educativa_familiar(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Educativa/Familiar guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404