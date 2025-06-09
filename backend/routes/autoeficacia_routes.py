from flask import Blueprint, request, jsonify
from backend.controllers.autoeficacia_controller import save_autoeficacia

autoeficacia_bp = Blueprint('autoeficacia_bp', __name__)

@autoeficacia_bp.route('/api/autoeficacia', methods=['POST'])
def save():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Formato JSON requerido'}), 400
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if not codigo_estudiante or not isinstance(data, dict):
        return jsonify({'success': False, 'message': 'Datos incompletos'}), 400
    if save_autoeficacia(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Autoeficacia guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404