from flask import Blueprint, request, jsonify
from backend.controllers.cognitiva_controller import save_cognitiva

cognitiva_bp = Blueprint('cognitiva_bp', __name__)

@cognitiva_bp.route('/api/cognitiva', methods=['POST'])
def save():
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if save_cognitiva(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Cognitiva guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404