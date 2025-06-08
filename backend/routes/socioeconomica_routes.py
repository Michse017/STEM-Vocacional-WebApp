from flask import Blueprint, request, jsonify
from backend.controllers.socioeconomica_controller import save_socioeconomica

socioeconomica_bp = Blueprint('socioeconomica_bp', __name__)

@socioeconomica_bp.route('/api/socioeconomica', methods=['POST'])
def save():
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if save_socioeconomica(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Socioeconómica guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404