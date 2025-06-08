from flask import Blueprint, request, jsonify
from backend.controllers.autoeficacia_controller import save_autoeficacia

autoeficacia_bp = Blueprint('autoeficacia_bp', __name__)

@autoeficacia_bp.route('/api/autoeficacia', methods=['POST'])
def save():
    codigo_estudiante = request.json.get('codigo_estudiante')
    data = request.json.get('data', {})
    if save_autoeficacia(codigo_estudiante, data):
        return jsonify({'success': True, 'message': 'Autoeficacia guardada'}), 200
    return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404