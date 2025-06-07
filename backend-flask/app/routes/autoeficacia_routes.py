from flask import Blueprint
from ..controllers.autoeficacia_controller import (
    obtener_todas_autoeficacias,
    crear_autoeficacia,
    obtener_autoeficacia_por_id,
    obtener_autoeficacias_por_usuario,
    eliminar_autoeficacia
)

autoeficacia_bp = Blueprint('autoeficacia', __name__)

# Rutas para respuestas de autoeficacia
autoeficacia_bp.route('/api/autoeficacia', methods=['GET'])(obtener_todas_autoeficacias)
autoeficacia_bp.route('/api/autoeficacia', methods=['POST'])(crear_autoeficacia)
autoeficacia_bp.route('/api/autoeficacia/<int:id_respuesta>', methods=['GET'])(obtener_autoeficacia_por_id)
autoeficacia_bp.route('/api/autoeficacia/usuario/<int:id_usuario>', methods=['GET'])(obtener_autoeficacias_por_usuario)
autoeficacia_bp.route('/api/autoeficacia/<int:id_respuesta>', methods=['DELETE'])(eliminar_autoeficacia)