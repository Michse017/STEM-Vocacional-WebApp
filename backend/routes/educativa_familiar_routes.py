from flask import Blueprint, request, jsonify
from backend.controllers.educativa_familiar_controller import save_educativa_familiar

educativa_familiar_bp = Blueprint('educativa_familiar_bp', __name__)

@educativa_familiar_bp.route('/api/educativa_familiar', methods=['POST'])
def save():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Formato JSON requerido'}), 400
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if not codigo_estudiante or not isinstance(data, dict):
        return jsonify({'success': False, 'message': 'Datos incompletos'}), 400
    if save_educativa_familiar(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Educativa/Familiar guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404