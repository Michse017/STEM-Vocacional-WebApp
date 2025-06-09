from flask import Blueprint, request, jsonify
from backend.controllers.socioeconomica_controller import save_socioeconomica

socioeconomica_bp = Blueprint('socioeconomica_bp', __name__)

@socioeconomica_bp.route('/api/socioeconomica', methods=['POST'])
def save():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Formato JSON requerido'}), 400
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if not codigo_estudiante or not isinstance(data, dict):
        return jsonify({'success': False, 'message': 'Datos incompletos'}), 400
    if save_socioeconomica(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Socioeconómica guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404